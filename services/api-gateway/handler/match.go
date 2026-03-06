package handler

import (
	"net/http"
	"time"

	goredis "github.com/redis/go-redis/v9"

	"github.com/logi-go/api-gateway/cache"
	"github.com/logi-go/api-gateway/db"
	"github.com/logi-go/api-gateway/middleware"
)

func ListProposals(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	driverID := middleware.DriverID(r)

	// Check Redis for pre-computed proposals from match-svc
	if cache.Client != nil {
		key := "match:proposals:" + driverID
		data, err := cache.Client.Get(ctx, key).Bytes()
		if err == nil {
			w.Header().Set("Content-Type", "application/json")
			w.Write(data)
			return
		}
		if err != goredis.Nil {
			// Redis error — fall through to DB
		}
	}

	rows, err := db.Pool.Query(ctx, `
		SELECT
			s.id, s.origin_address, s.dest_address,
			s.cargo_type, s.cargo_desc,
			s.weight_kg, s.volume_m3,
			s.pickup_from, s.delivery_by,
			s.reward_jpy, s.est_co2_kg,
			s.notes
		FROM shipments s
		WHERE s.status = 'pending'
		ORDER BY s.pickup_from ASC
		LIMIT 10
	`)

	if err != nil {
		if Env("ENV", "development") == "development" {
			JSON(w, http.StatusOK, devProposals())
			return
		}
		Err(w, "query failed", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	proposals := []map[string]any{}
	for rows.Next() {
		var id, origin, dest, cargoType, cargoDesc string
		var notes *string
		var weightKg float64
		var volumeM3, rewardJPY, co2 *float64
		var pickupFrom, deliveryBy time.Time

		if err := rows.Scan(
			&id, &origin, &dest,
			&cargoType, &cargoDesc,
			&weightKg, &volumeM3,
			&pickupFrom, &deliveryBy,
			&rewardJPY, &co2,
			&notes,
		); err != nil {
			continue
		}

		proposals = append(proposals, map[string]any{
			"match_id": id,
			"shipment": map[string]any{
				"id":     id,
				"status": "pending",
				"pickup": map[string]any{
					"name":    origin,
					"address": origin,
				},
				"dropoff": map[string]any{
					"name":    dest,
					"address": dest,
				},
				"cargo_type": cargoType,
				"cargo_desc": cargoDesc,
				"weight_kg":  weightKg,
				"volume_m3":  volumeM3,
				"notes":      notes,
				"fee_jpy":    rewardJPY,
			},
			"score":                  0.90,
			"distance_to_pickup_km":  3.5,
			"estimated_earnings_jpy": rewardJPY,
			"co2_reduction_kg":       co2,
			"expires_at":             pickupFrom.Format(time.RFC3339),
		})
	}

	JSON(w, http.StatusOK, proposals)
}

func AcceptMatch(w http.ResponseWriter, r *http.Request) {
	shipmentID := r.PathValue("id")
	driverID := middleware.DriverID(r)
	ctx := r.Context()

	// Get truck_id from driver entity
	var truckID string
	err := db.Pool.QueryRow(ctx,
		`SELECT metadata->>'truck_id' FROM entities WHERE id = $1 AND type = 'driver'`,
		driverID,
	).Scan(&truckID)
	if err != nil {
		Err(w, "driver not found", http.StatusUnauthorized)
		return
	}

	_, err = db.Pool.Exec(ctx, `
		UPDATE shipments
		SET status = 'in_transit',
		    matched_truck_id = $1::uuid,
		    matched_at = NOW()
		WHERE id = $2 AND status = 'pending'
	`, truckID, shipmentID)

	if err != nil {
		Err(w, "accept failed", http.StatusInternalServerError)
		return
	}

	GetShipment(w, r.WithContext(r.Context()))
}

func DeclineMatch(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNoContent)
}

func devProposals() []map[string]any {
	return []map[string]any{
		{
			"match_id": "cccccccc-0000-0000-0000-000000000001",
			"shipment": map[string]any{
				"id": "cccccccc-0000-0000-0000-000000000001", "status": "pending",
				"pickup":     map[string]any{"name": "大阪市中央区", "address": "大阪市中央区"},
				"dropoff":    map[string]any{"name": "東京都港区", "address": "東京都港区"},
				"cargo_type": "dry", "cargo_desc": "精密機器",
				"weight_kg": 3500, "fee_jpy": 85000,
				"notes": "精密機器のため振動注意。荷主立ち合い必要。",
			},
			"score": 0.94, "distance_to_pickup_km": 2.3,
			"estimated_earnings_jpy": 85000, "co2_reduction_kg": 42.3,
			"expires_at": time.Now().Add(15 * time.Minute).Format(time.RFC3339),
		},
		{
			"match_id": "cccccccc-0000-0000-0000-000000000002",
			"shipment": map[string]any{
				"id": "cccccccc-0000-0000-0000-000000000002", "status": "pending",
				"pickup":     map[string]any{"name": "神戸市中央区", "address": "神戸市中央区"},
				"dropoff":    map[string]any{"name": "名古屋市中区", "address": "名古屋市中区"},
				"cargo_type": "refrigerated", "cargo_desc": "生鮮食品",
				"weight_kg": 1200, "fee_jpy": 42000,
				"notes": "要冷蔵 5℃以下維持",
			},
			"score": 0.87, "distance_to_pickup_km": 5.1,
			"estimated_earnings_jpy": 42000, "co2_reduction_kg": 18.7,
			"expires_at": time.Now().Add(12 * time.Minute).Format(time.RFC3339),
		},
	}
}
