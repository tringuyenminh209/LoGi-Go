package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	mqtt "github.com/eclipse/paho.mqtt.golang"
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

type TelemetryMsg struct {
	TruckID    string  `json:"truck_id"`
	DriverID   string  `json:"driver_id"`
	TenantID   string  `json:"tenant_id"`
	Lat        float64 `json:"lat"`
	Lng        float64 `json:"lng"`
	SpeedKmh   float64 `json:"speed_kmh"`
	HeadingDeg float64 `json:"heading_deg"`
	LoadKg     float64 `json:"load_kg"`
	LoadM3     float64 `json:"load_m3"`
	Status     string  `json:"status"`
	Timestamp  string  `json:"timestamp"`
}

type EpcisEvent struct {
	EventType    string  `json:"event_type"`
	EpcisEventID string  `json:"epcis_event_id"`
	TenantID     string  `json:"tenant_id"`
	ShipperID    string  `json:"shipper_id"`
	OriginAddr   string  `json:"origin_address"`
	DestAddr     string  `json:"dest_address"`
	CargoType    string  `json:"cargo_type"`
	CargoDesc    string  `json:"cargo_desc"`
	WeightKg     float64 `json:"weight_kg"`
	VolumeM3     float64 `json:"volume_m3"`
	PickupFrom   string  `json:"pickup_from"`
	DeliveryBy   string  `json:"delivery_by"`
	RewardJPY    int64   `json:"reward_jpy"`
}

// ── Globals ────────────────────────────────────────────────────────────────────

var pool *pgxpool.Pool
var rdb *redis.Client

var stats struct {
	mqttReceived int64
	dbInserted   int64
	dbFailed     int64
}

// ── MQTT telemetry handler ─────────────────────────────────────────────────────

func handleTelemetry(_ mqtt.Client, msg mqtt.Message) {
	stats.mqttReceived++

	var t TelemetryMsg
	if err := json.Unmarshal(msg.Payload(), &t); err != nil {
		slog.Warn("invalid telemetry payload", "topic", msg.Topic(), "error", err)
		return
	}

	if t.TruckID == "" || t.Lat == 0 || t.Lng == 0 {
		slog.Warn("telemetry missing required fields", "truck_id", t.TruckID)
		return
	}

	ts := time.Now()
	if t.Timestamp != "" {
		if parsed, err := time.Parse(time.RFC3339, t.Timestamp); err == nil {
			ts = parsed
		}
	}

	ctx := context.Background()

	// 1. Update Redis trucks:live (real-time position for match-svc and ws-server)
	if rdb != nil {
		posData, _ := json.Marshal(map[string]any{
			"driver_id": t.DriverID,
			"truck_id":  t.TruckID,
			"lat":       t.Lat,
			"lng":       t.Lng,
			"speed_kmh": t.SpeedKmh,
			"heading":   t.HeadingDeg,
			"load_kg":   t.LoadKg,
			"updated":   ts.Format(time.RFC3339),
		})
		rdb.HSet(ctx, "trucks:live", t.DriverID, posData)
		rdb.Expire(ctx, "trucks:live", 10*time.Minute) // TTL safety net
	}

	// 2. Insert into telemetry hypertable (time-series history)
	if pool != nil {
		_, err := pool.Exec(ctx, `
			INSERT INTO telemetry (
				time, entity_id, tenant_id,
				location, speed_kmh, heading_deg,
				current_load_kg, current_load_m3,
				driver_id, driver_status, raw_payload
			) VALUES (
				$1, $2::uuid, $3::uuid,
				ST_MakePoint($4, $5)::geography, $6, $7,
				$8, $9,
				$10::uuid, $11, $12::jsonb
			)
		`,
			ts, t.TruckID, t.TenantID,
			t.Lng, t.Lat, t.SpeedKmh, t.HeadingDeg,
			t.LoadKg, t.LoadM3,
			nilIfEmpty(t.DriverID), t.Status, string(msg.Payload()),
		)
		if err != nil {
			stats.dbFailed++
			slog.Debug("telemetry insert failed", "truck_id", t.TruckID, "error", err)
		} else {
			stats.dbInserted++
		}
	}
}

func nilIfEmpty(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

// ── EPCIS webhook handler ──────────────────────────────────────────────────────

func handleEpcisEvent(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}

	var ev EpcisEvent
	if err := json.NewDecoder(r.Body).Decode(&ev); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
		return
	}

	if ev.TenantID == "" || ev.OriginAddr == "" || ev.DestAddr == "" || ev.WeightKg <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "missing required fields"})
		return
	}

	if pool == nil {
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "db unavailable"})
		return
	}

	// Parse times
	pickupFrom := time.Now().Add(24 * time.Hour)
	deliveryBy := time.Now().Add(72 * time.Hour)
	if ev.PickupFrom != "" {
		if p, err := time.Parse(time.RFC3339, ev.PickupFrom); err == nil {
			pickupFrom = p
		}
	}
	if ev.DeliveryBy != "" {
		if d, err := time.Parse(time.RFC3339, ev.DeliveryBy); err == nil {
			deliveryBy = d
		}
	}

	ctx := r.Context()
	var shipmentID string
	err := pool.QueryRow(ctx, `
		INSERT INTO shipments (
			tenant_id, shipper_id, epcis_event_id,
			origin_address, dest_address,
			cargo_type, cargo_desc, weight_kg, volume_m3,
			pickup_from, pickup_to, delivery_by,
			status, source_platform, reward_jpy
		) VALUES (
			$1::uuid, $2::uuid, $3,
			$4, $5,
			$6, $7, $8, $9,
			$10, $10 + INTERVAL '4 hours', $11,
			'pending', 'epcis', $12
		) RETURNING id::text
	`,
		ev.TenantID, ev.ShipperID, nilIfEmpty(ev.EpcisEventID),
		ev.OriginAddr, ev.DestAddr,
		ev.CargoType, ev.CargoDesc, ev.WeightKg, ev.VolumeM3,
		pickupFrom, deliveryBy, ev.RewardJPY,
	).Scan(&shipmentID)

	if err != nil {
		slog.Warn("epcis shipment insert failed", "error", err)
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "insert failed"})
		return
	}

	// Notify match-svc via Redis pub/sub
	if rdb != nil {
		rdb.Publish(ctx, "logi-go:events", fmt.Sprintf(`{"type":"new_shipment","shipment_id":"%s"}`, shipmentID))
	}

	slog.Info("epcis shipment created", "shipment_id", shipmentID, "origin", ev.OriginAddr, "dest", ev.DestAddr)
	writeJSON(w, http.StatusCreated, map[string]any{
		"shipment_id": shipmentID,
		"status":      "pending",
	})
}

// ── HTTP helpers ───────────────────────────────────────────────────────────────

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"status":        "ok",
		"service":       "ingest-svc",
		"mqtt_received": stats.mqttReceived,
		"db_inserted":   stats.dbInserted,
		"db_failed":     stats.dbFailed,
	})
}

func statsHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"mqtt_received": stats.mqttReceived,
		"db_inserted":   stats.dbInserted,
		"db_failed":     stats.dbFailed,
		"db_connected":  pool != nil,
		"redis_connected": rdb != nil,
	})
}

// ── Main ───────────────────────────────────────────────────────────────────────

func main() {
	ctx := context.Background()

	// PostgreSQL
	if pgDSN := env("PG_DSN", ""); pgDSN != "" {
		var err error
		pool, err = pgxpool.New(ctx, pgDSN)
		if err != nil || pool.Ping(ctx) != nil {
			slog.Warn("postgres unavailable, telemetry will not be persisted", "error", err)
			pool = nil
		} else {
			slog.Info("postgres connected")
			defer pool.Close()
		}
	}

	// Redis
	redisAddr := env("REDIS_ADDR", "localhost:6379")
	rdb = redis.NewClient(&redis.Options{Addr: redisAddr})
	if err := rdb.Ping(ctx).Err(); err != nil {
		slog.Warn("redis unavailable, live positions disabled", "error", err)
		rdb = nil
	} else {
		slog.Info("redis connected", "addr", redisAddr)
	}

	// MQTT
	mqttBroker := env("MQTT_BROKER", "tcp://localhost:1883")
	opts := mqtt.NewClientOptions().
		AddBroker(mqttBroker).
		SetClientID("ingest-svc").
		SetAutoReconnect(true).
		SetConnectRetry(true).
		SetConnectRetryInterval(5 * time.Second).
		SetOnConnectHandler(func(c mqtt.Client) {
			slog.Info("mqtt connected, subscribing to telemetry topics")
			c.Subscribe("logi-go/telemetry/#", 1, handleTelemetry)
		}).
		SetConnectionLostHandler(func(_ mqtt.Client, err error) {
			slog.Warn("mqtt connection lost", "error", err)
		})

	mqttClient := mqtt.NewClient(opts)
	if token := mqttClient.Connect(); token.Wait() && token.Error() != nil {
		slog.Warn("mqtt connect failed (will retry)", "broker", mqttBroker, "error", token.Error())
	} else {
		slog.Info("mqtt connected", "broker", mqttBroker)
	}

	// HTTP server
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", healthHandler)
	mux.HandleFunc("GET /stats", statsHandler)
	mux.HandleFunc("POST /epcis/events", handleEpcisEvent)

	// Dev helper: simulate telemetry via HTTP
	mux.HandleFunc("POST /dev/telemetry", func(w http.ResponseWriter, r *http.Request) {
		var t TelemetryMsg
		if err := json.NewDecoder(r.Body).Decode(&t); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid JSON"})
			return
		}
		payload, _ := json.Marshal(t)
		handleTelemetry(nil, &fakeMessage{payload: payload, topic: "logi-go/telemetry/dev"})
		writeJSON(w, http.StatusOK, map[string]string{"status": "ingested"})
	})

	httpPort := env("HTTP_PORT", "8080")
	go func() {
		slog.Info("ingest-svc HTTP starting", "port", httpPort)
		if err := http.ListenAndServe(":"+httpPort, mux); err != nil {
			slog.Error("HTTP server failed", "error", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	slog.Info("shutting down ingest-svc")
	mqttClient.Disconnect(1000)
}

// fakeMessage implements mqtt.Message for the dev HTTP telemetry endpoint.
type fakeMessage struct {
	payload []byte
	topic   string
}

func (m *fakeMessage) Duplicate() bool   { return false }
func (m *fakeMessage) Qos() byte         { return 0 }
func (m *fakeMessage) Retained() bool    { return false }
func (m *fakeMessage) Topic() string     { return m.topic }
func (m *fakeMessage) MessageID() uint16 { return 0 }
func (m *fakeMessage) Payload() []byte   { return m.payload }
func (m *fakeMessage) Ack()              {}
