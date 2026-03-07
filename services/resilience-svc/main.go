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

	"github.com/gorilla/websocket"
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

type EarthquakePayload struct {
	Magnitude float64 `json:"magnitude"`
	Epicenter string  `json:"epicenter"`
	Depth     int     `json:"depth"`
	Intensity string  `json:"intensity"`
	Tsunami   bool    `json:"tsunami"`
	IssuedAt  string  `json:"issued_at"`
}

type JmaMessage struct {
	Type    string            `json:"type"`
	Payload EarthquakePayload `json:"payload"`
}

// ── Globals ────────────────────────────────────────────────────────────────────

var pool *pgxpool.Pool
var rdb *redis.Client

var stats struct {
	alertsReceived int64
	autoResponses  int64
}

// ── JMA WebSocket listener ─────────────────────────────────────────────────────

func connectJma(ctx context.Context) {
	jmaURL := env("JMA_WS_URL", "ws://jma-mock:9999/ws")

	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

		slog.Info("connecting to JMA WebSocket", "url", jmaURL)
		conn, _, err := websocket.DefaultDialer.Dial(jmaURL, nil)
		if err != nil {
			slog.Warn("jma connect failed, retrying in 5s", "error", err)
			time.Sleep(5 * time.Second)
			continue
		}
		slog.Info("jma connected")

		for {
			_, data, err := conn.ReadMessage()
			if err != nil {
				slog.Warn("jma read error, reconnecting", "error", err)
				conn.Close()
				break
			}

			var msg JmaMessage
			if err := json.Unmarshal(data, &msg); err != nil {
				slog.Warn("invalid jma message", "error", err)
				continue
			}

			if msg.Type == "earthquake" {
				handleEarthquake(ctx, msg.Payload)
			}
		}

		time.Sleep(3 * time.Second)
	}
}

// ── Earthquake handler ─────────────────────────────────────────────────────────

func handleEarthquake(ctx context.Context, eq EarthquakePayload) {
	stats.alertsReceived++
	slog.Info("earthquake alert received",
		"magnitude", eq.Magnitude,
		"epicenter", eq.Epicenter,
		"intensity", eq.Intensity,
		"tsunami", eq.Tsunami,
	)

	// 1. Publish alert to all drivers via Redis → ws-server → frontend
	if rdb != nil {
		alertData, _ := json.Marshal(map[string]any{
			"type": "earthquake_alert",
			"payload": map[string]any{
				"magnitude":  eq.Magnitude,
				"epicenter":  eq.Epicenter,
				"depth":      eq.Depth,
				"intensity":  eq.Intensity,
				"tsunami":    eq.Tsunami,
				"issued_at":  eq.IssuedAt,
				"alert_time": time.Now().Format(time.RFC3339),
			},
		})
		rdb.Publish(ctx, "logi-go:alerts", string(alertData))
		slog.Info("earthquake alert published to Redis")
	}

	// 2. Auto-response: freeze in-transit shipments if magnitude >= 5.0
	if eq.Magnitude >= 5.0 && pool != nil {
		freezeShipments(ctx, eq)
	}

	// 3. Create notifications for all active drivers
	if pool != nil {
		createAlertNotifications(ctx, eq)
	}

	stats.autoResponses++
}

func freezeShipments(ctx context.Context, eq EarthquakePayload) {
	tag, err := pool.Exec(ctx, `
		UPDATE shipments
		SET status = 'on_hold',
		    notes = COALESCE(notes, '') || $1
		WHERE status = 'in_transit'
	`, fmt.Sprintf("\n[EEW] %s M%.1f — auto-hold at %s", eq.Epicenter, eq.Magnitude, time.Now().Format("15:04")))

	if err != nil {
		slog.Warn("freeze shipments failed", "error", err)
		return
	}
	slog.Info("shipments frozen", "affected", tag.RowsAffected())
}

func createAlertNotifications(ctx context.Context, eq EarthquakePayload) {
	tsunamiMsg := ""
	if eq.Tsunami {
		tsunamiMsg = " 津波警報あり — 高台へ避難してください。"
	}

	title := fmt.Sprintf("地震速報: %s M%.1f", eq.Epicenter, eq.Magnitude)
	message := fmt.Sprintf(
		"震度%s 深さ%dkm%s 走行中の場合は安全な場所に停車してください。",
		eq.Intensity, eq.Depth, tsunamiMsg,
	)

	_, err := pool.Exec(ctx, `
		INSERT INTO notifications (driver_id, tenant_id, type, title, message, action, action_screen)
		SELECT e.id, e.tenant_id, 'earthquake', $1, $2, '安全確認', 'safety'
		FROM entities e
		WHERE e.type = 'driver' AND e.is_active = TRUE
	`, title, message)

	if err != nil {
		slog.Warn("alert notifications insert failed", "error", err)
	} else {
		slog.Info("earthquake notifications created for all active drivers")
	}
}

// ── HTTP handlers ──────────────────────────────────────────────────────────────

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]any{
		"status":          "ok",
		"service":         "resilience-svc",
		"alerts_received": stats.alertsReceived,
		"auto_responses":  stats.autoResponses,
	})
}

// Dev endpoint: manually trigger earthquake handling
func devTriggerHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	var eq EarthquakePayload
	if err := json.NewDecoder(r.Body).Decode(&eq); err != nil {
		eq = EarthquakePayload{
			Magnitude: 5.5,
			Epicenter: "相模湾",
			Depth:     30,
			Intensity: "4",
			Tsunami:   false,
			IssuedAt:  time.Now().Format(time.RFC3339),
		}
	}
	if eq.IssuedAt == "" {
		eq.IssuedAt = time.Now().Format(time.RFC3339)
	}
	handleEarthquake(context.Background(), eq)
	writeJSON(w, http.StatusOK, map[string]string{"status": "alert processed"})
}

// Active alerts: check if any shipments are on_hold due to EEW
func activeAlertsHandler(w http.ResponseWriter, r *http.Request) {
	if pool == nil {
		writeJSON(w, http.StatusOK, map[string]any{"on_hold_count": 0, "alerts": []any{}})
		return
	}

	rows, err := pool.Query(r.Context(), `
		SELECT id::text, origin_address, dest_address, cargo_desc, notes
		FROM shipments
		WHERE status = 'on_hold'
		ORDER BY updated_at DESC
		LIMIT 20
	`)
	if err != nil {
		writeJSON(w, http.StatusOK, map[string]any{"on_hold_count": 0, "alerts": []any{}})
		return
	}
	defer rows.Close()

	var items []map[string]string
	for rows.Next() {
		var id, origin, dest, cargo string
		var notes *string
		if err := rows.Scan(&id, &origin, &dest, &cargo, &notes); err != nil {
			continue
		}
		n := ""
		if notes != nil {
			n = *notes
		}
		items = append(items, map[string]string{
			"id": id, "origin": origin, "dest": dest,
			"cargo": cargo, "notes": n,
		})
	}
	if items == nil {
		items = []map[string]string{}
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"on_hold_count": len(items),
		"shipments":     items,
	})
}

// Resume on_hold shipments after earthquake clearance
func resumeHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.WriteHeader(http.StatusMethodNotAllowed)
		return
	}
	if pool == nil {
		writeJSON(w, http.StatusOK, map[string]string{"status": "no db"})
		return
	}
	tag, err := pool.Exec(r.Context(), `
		UPDATE shipments SET status = 'in_transit'
		WHERE status = 'on_hold'
	`)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": err.Error()})
		return
	}
	slog.Info("shipments resumed", "count", tag.RowsAffected())

	// Notify drivers via Redis
	if rdb != nil {
		rdb.Publish(r.Context(), "logi-go:alerts", `{"type":"earthquake_clear","payload":{"message":"地震警報解除 — 通常運行を再開してください"}}`)
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"status":  "resumed",
		"resumed": tag.RowsAffected(),
	})
}

// ── Main ───────────────────────────────────────────────────────────────────────

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// PostgreSQL
	if pgDSN := env("PG_DSN", ""); pgDSN != "" {
		var err error
		pool, err = pgxpool.New(ctx, pgDSN)
		if err != nil || pool.Ping(ctx) != nil {
			slog.Warn("postgres unavailable", "error", err)
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
		slog.Warn("redis unavailable", "error", err)
		rdb = nil
	} else {
		slog.Info("redis connected", "addr", redisAddr)
	}

	// JMA WebSocket listener (background goroutine)
	go connectJma(ctx)

	// HTTP server
	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", healthHandler)
	mux.HandleFunc("GET /alerts/active", activeAlertsHandler)
	mux.HandleFunc("POST /alerts/resume", resumeHandler)
	mux.HandleFunc("POST /dev/trigger", devTriggerHandler)

	httpPort := env("HTTP_PORT", "8080")
	go func() {
		slog.Info("resilience-svc HTTP starting", "port", httpPort)
		if err := http.ListenAndServe(":"+httpPort, mux); err != nil {
			slog.Error("HTTP server failed", "error", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	slog.Info("shutting down resilience-svc")
	cancel()
}
