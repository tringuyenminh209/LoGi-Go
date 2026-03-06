package main

import (
	"context"
	"encoding/json"
	"log/slog"
	"math"
	"net/http"
	"os"
	"sort"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func env(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

// ── Types ──────────────────────────────────────────────────────────────────────

type TruckPos struct {
	DriverID string  `json:"driver_id"`
	Lat      float64 `json:"lat"`
	Lng      float64 `json:"lng"`
	SpeedKmh float64 `json:"speed_kmh"`
}

type Place struct {
	Name    string `json:"name"`
	Address string `json:"address"`
}

type ShipmentView struct {
	ID        string   `json:"id"`
	Status    string   `json:"status"`
	Pickup    Place    `json:"pickup"`
	Dropoff   Place    `json:"dropoff"`
	CargoType string   `json:"cargo_type"`
	CargoDesc string   `json:"cargo_desc"`
	WeightKg  float64  `json:"weight_kg"`
	FeeJPY    *float64 `json:"fee_jpy"`
}

type Proposal struct {
	MatchID              string       `json:"match_id"`
	Score                float64      `json:"score"`
	DistanceToPickupKm   float64      `json:"distance_to_pickup_km"`
	EstimatedEarningsJPY *float64     `json:"estimated_earnings_jpy"`
	CO2ReductionKg       *float64     `json:"co2_reduction_kg"`
	ExpiresAt            string       `json:"expires_at"`
	Shipment             ShipmentView `json:"shipment"`
}

type pendingShipment struct {
	ID            string
	OriginAddress string
	DestAddress   string
	CargoType     string
	CargoDesc     string
	WeightKg      float64
	PickupFrom    time.Time
	RewardJPY     *float64
	EstCO2Kg      *float64
}

// ── Globals ────────────────────────────────────────────────────────────────────

var pool *pgxpool.Pool
var rdb *redis.Client

// ── Haversine ──────────────────────────────────────────────────────────────────

func haversine(lat1, lng1, lat2, lng2 float64) float64 {
	const R = 6371.0
	dLat := (lat2 - lat1) * math.Pi / 180
	dLng := (lng2 - lng1) * math.Pi / 180
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*math.Pi/180)*math.Cos(lat2*math.Pi/180)*
			math.Sin(dLng/2)*math.Sin(dLng/2)
	return R * 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
}

// ── City coordinate lookup ──────────────────────────────────────────────────────

var cityCoords = map[string][2]float64{
	"東京":  {35.6762, 139.6503},
	"大阪":  {34.6937, 135.5023},
	"名古屋": {35.1815, 136.9066},
	"福岡":  {33.5904, 130.4017},
	"札幌":  {43.0618, 141.3545},
	"横浜":  {35.4437, 139.6380},
	"神戸":  {34.6901, 135.1956},
	"仙台":  {38.2682, 140.8694},
	"広島":  {34.3853, 132.4553},
	"京都":  {35.0116, 135.7681},
	"千葉":  {35.6074, 140.1065},
	"埼玉":  {35.8616, 139.6455},
}

func coordsForAddress(addr string) (float64, float64, bool) {
	for city, coords := range cityCoords {
		if strings.Contains(addr, city) {
			return coords[0], coords[1], true
		}
	}
	return 0, 0, false
}

// ── DB helpers ──────────────────────────────────────────────────────────────────

func loadPendingShipments(ctx context.Context) ([]pendingShipment, error) {
	rows, err := pool.Query(ctx, `
		SELECT id, origin_address, dest_address,
		       cargo_type, cargo_desc, weight_kg,
		       pickup_from, reward_jpy, est_co2_kg
		FROM shipments
		WHERE status = 'pending'
		ORDER BY pickup_from ASC
		LIMIT 100
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []pendingShipment
	for rows.Next() {
		var s pendingShipment
		if err := rows.Scan(
			&s.ID, &s.OriginAddress, &s.DestAddress,
			&s.CargoType, &s.CargoDesc, &s.WeightKg,
			&s.PickupFrom, &s.RewardJPY, &s.EstCO2Kg,
		); err != nil {
			continue
		}
		result = append(result, s)
	}
	return result, nil
}

func loadTruckPositions(ctx context.Context) ([]TruckPos, error) {
	vals, err := rdb.HGetAll(ctx, "trucks:live").Result()
	if err != nil {
		return nil, err
	}
	var result []TruckPos
	for _, v := range vals {
		var pos TruckPos
		if err := json.Unmarshal([]byte(v), &pos); err == nil {
			result = append(result, pos)
		}
	}
	return result, nil
}

// ── Scoring ────────────────────────────────────────────────────────────────────

func scoreShipments(truck TruckPos, shipments []pendingShipment) []Proposal {
	var proposals []Proposal

	for _, s := range shipments {
		pickLat, pickLng, ok := coordsForAddress(s.OriginAddress)
		if !ok {
			continue
		}
		dist := haversine(truck.Lat, truck.Lng, pickLat, pickLng)

		// 0-1 factors, higher = better match
		distScore := math.Max(0, 1.0-dist/300.0) // max 300km radius
		loadScore := math.Min(s.WeightKg/10000.0, 1.0)
		co2Score := 0.5
		if s.EstCO2Kg != nil && *s.EstCO2Kg > 0 {
			co2Score = math.Max(0, 1.0-*s.EstCO2Kg/500.0)
		}
		// Weights: distance 30%, load 40%, CO2 20%, driver 10%
		score := 0.30*distScore + 0.40*loadScore + 0.20*co2Score + 0.10*0.85
		score = math.Round(score*100) / 100

		if score < 0.25 {
			continue // prune very poor matches
		}

		proposals = append(proposals, Proposal{
			MatchID:              s.ID,
			Score:                score,
			DistanceToPickupKm:   math.Round(dist*10) / 10,
			EstimatedEarningsJPY: s.RewardJPY,
			CO2ReductionKg:       s.EstCO2Kg,
			ExpiresAt:            s.PickupFrom.Format(time.RFC3339),
			Shipment: ShipmentView{
				ID:        s.ID,
				Status:    "pending",
				Pickup:    Place{Name: s.OriginAddress, Address: s.OriginAddress},
				Dropoff:   Place{Name: s.DestAddress, Address: s.DestAddress},
				CargoType: s.CargoType,
				CargoDesc: s.CargoDesc,
				WeightKg:  s.WeightKg,
				FeeJPY:    s.RewardJPY,
			},
		})
	}

	sort.Slice(proposals, func(i, j int) bool {
		return proposals[i].Score > proposals[j].Score
	})
	if len(proposals) > 10 {
		proposals = proposals[:10]
	}
	return proposals
}

// ── Match runner ───────────────────────────────────────────────────────────────

func runMatching(ctx context.Context) {
	if pool == nil || rdb == nil {
		slog.Warn("skip matching: no DB/Redis connection")
		return
	}

	positions, err := loadTruckPositions(ctx)
	if err != nil {
		slog.Warn("failed to load truck positions", "error", err)
		return
	}
	if len(positions) == 0 {
		slog.Debug("no truck positions in Redis, skipping match run")
		return
	}

	shipments, err := loadPendingShipments(ctx)
	if err != nil {
		slog.Warn("failed to load pending shipments", "error", err)
		return
	}
	if len(shipments) == 0 {
		slog.Debug("no pending shipments, skipping match run")
		return
	}

	driversWithMatches := 0
	for _, truck := range positions {
		proposals := scoreShipments(truck, shipments)
		if len(proposals) == 0 {
			continue
		}
		data, err := json.Marshal(proposals)
		if err != nil {
			continue
		}
		key := "match:proposals:" + truck.DriverID
		rdb.Set(ctx, key, data, 5*time.Minute)
		driversWithMatches++
	}

	slog.Info("match run complete",
		"trucks", len(positions),
		"shipments", len(shipments),
		"drivers_matched", driversWithMatches,
	)

	if driversWithMatches > 0 {
		rdb.Publish(ctx, "logi-go:events", `{"type":"match_proposal"}`)
	}
}

// ── HTTP handlers ──────────────────────────────────────────────────────────────

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok", "service": "match-svc"})
}

func triggerMatchHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	go runMatching(context.Background())
	writeJSON(w, http.StatusAccepted, map[string]string{"status": "matching started"})
}

func getProposalsHandler(w http.ResponseWriter, r *http.Request) {
	if rdb == nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "redis unavailable"})
		return
	}
	driverID := r.PathValue("driverID")
	if driverID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "missing driverID"})
		return
	}

	key := "match:proposals:" + driverID
	data, err := rdb.Get(r.Context(), key).Bytes()
	if err == redis.Nil {
		writeJSON(w, http.StatusOK, []any{})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "redis error"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

// ── Main ───────────────────────────────────────────────────────────────────────

func main() {
	ctx := context.Background()

	// Connect to Redis
	redisAddr := env("REDIS_ADDR", "localhost:6379")
	rdb = redis.NewClient(&redis.Options{Addr: redisAddr})
	if err := rdb.Ping(ctx).Err(); err != nil {
		slog.Warn("redis unavailable, matching disabled", "error", err)
		rdb = nil
	} else {
		slog.Info("redis connected", "addr", redisAddr)
	}

	// Connect to PostgreSQL
	pgDSN := env("PG_DSN", "")
	if pgDSN != "" {
		var err error
		pool, err = pgxpool.New(ctx, pgDSN)
		if err != nil || pool.Ping(ctx) != nil {
			slog.Warn("postgres unavailable, matching disabled", "error", err)
			pool = nil
		} else {
			slog.Info("postgres connected")
			defer pool.Close()
		}
	}

	// HTTP server
	mux := http.NewServeMux()
	mux.HandleFunc("/health", healthHandler)
	mux.HandleFunc("/match/run", triggerMatchHandler)
	mux.HandleFunc("/match/proposals/{driverID}", getProposalsHandler)

	go func() {
		httpPort := env("HTTP_PORT", "8080")
		slog.Info("match-svc HTTP listening", "port", httpPort)
		if err := http.ListenAndServe(":"+httpPort, mux); err != nil {
			slog.Error("HTTP server failed", "error", err)
		}
	}()

	// Periodic match runner every 30 seconds
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	// Run immediately on startup
	if pool != nil && rdb != nil {
		slog.Info("running initial match pass")
		runMatching(ctx)
	}

	for range ticker.C {
		runMatching(ctx)
	}
}
