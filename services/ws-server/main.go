package main

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
	"github.com/redis/go-redis/v9"
)

// ── Config ────────────────────────────────────────────────────────────────────

func env(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func jwtSecret() []byte {
	s := env("JWT_SECRET", "dev-secret-change-in-production")
	return []byte(s)
}

// ── Message types ─────────────────────────────────────────────────────────────

type Message struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload,omitempty"`
}

type TruckPos struct {
	DriverID  string  `json:"driver_id"`
	Lat       float64 `json:"lat"`
	Lng       float64 `json:"lng"`
	SpeedKmh  float64 `json:"speed_kmh"`
	Heading   float64 `json:"heading"`
	UpdatedAt string  `json:"updated_at"`
}

// ── Redis ─────────────────────────────────────────────────────────────────────

var rdb *redis.Client

func initRedis() {
	rdb = redis.NewClient(&redis.Options{
		Addr: env("REDIS_ADDR", "localhost:6379"),
	})
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	if err := rdb.Ping(ctx).Err(); err != nil {
		slog.Warn("redis unavailable, running without pub/sub", "error", err)
		rdb = nil
	} else {
		slog.Info("redis connected")
	}
}

// ── Hub ───────────────────────────────────────────────────────────────────────

type Client struct {
	conn     *websocket.Conn
	driverID string
}

type Hub struct {
	mu      sync.RWMutex
	clients map[*websocket.Conn]*Client

	// in-memory truck positions (driverID → TruckPos)
	posMu     sync.RWMutex
	positions map[string]TruckPos
}

func newHub() *Hub {
	return &Hub{
		clients:   make(map[*websocket.Conn]*Client),
		positions: make(map[string]TruckPos),
	}
}

func (h *Hub) add(c *Client) {
	h.mu.Lock()
	h.clients[c.conn] = c
	h.mu.Unlock()
}

func (h *Hub) remove(conn *websocket.Conn) {
	h.mu.Lock()
	if c, ok := h.clients[conn]; ok {
		h.posMu.Lock()
		delete(h.positions, c.driverID)
		h.posMu.Unlock()
	}
	delete(h.clients, conn)
	h.mu.Unlock()
}

func (h *Hub) broadcast(msg any) {
	data, _ := json.Marshal(msg)
	h.mu.RLock()
	defer h.mu.RUnlock()
	for conn := range h.clients {
		conn.WriteMessage(websocket.TextMessage, data) //nolint:errcheck
	}
}

func (h *Hub) sendTo(driverID string, msg any) {
	data, _ := json.Marshal(msg)
	h.mu.RLock()
	defer h.mu.RUnlock()
	for _, c := range h.clients {
		if c.driverID == driverID {
			c.conn.WriteMessage(websocket.TextMessage, data) //nolint:errcheck
			return
		}
	}
}

func (h *Hub) updatePosition(pos TruckPos) {
	h.posMu.Lock()
	h.positions[pos.DriverID] = pos
	snapshot := make(map[string]TruckPos, len(h.positions))
	for k, v := range h.positions {
		snapshot[k] = v
	}
	h.posMu.Unlock()

	// Persist to Redis
	if rdb != nil {
		data, _ := json.Marshal(pos)
		rdb.HSet(context.Background(), "trucks:live", pos.DriverID, data)
		rdb.Expire(context.Background(), "trucks:live", 10*time.Minute)
	}

	// Broadcast updated map to all clients
	h.broadcast(map[string]any{
		"type":    "truck_positions",
		"payload": snapshot,
	})
}

func (h *Hub) allPositions() map[string]TruckPos {
	h.posMu.RLock()
	defer h.posMu.RUnlock()
	snapshot := make(map[string]TruckPos, len(h.positions))
	for k, v := range h.positions {
		snapshot[k] = v
	}
	return snapshot
}

var hub = newHub()

// ── JWT auth ──────────────────────────────────────────────────────────────────

func parseDriverID(tokenStr string) (string, error) {
	// In dev, accept any non-empty token and return a default driver ID
	if env("ENV", "development") == "development" && len(tokenStr) > 0 && len(tokenStr) < 20 {
		return "aaaaaaaa-0000-0000-0000-000000000001", nil
	}
	tok, err := jwt.Parse(tokenStr, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return jwtSecret(), nil
	})
	if err != nil || !tok.Valid {
		return "", err
	}
	claims, _ := tok.Claims.(jwt.MapClaims)
	sub, _ := claims["sub"].(string)
	return sub, nil
}

// ── WebSocket handler ─────────────────────────────────────────────────────────

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

func handleWS(w http.ResponseWriter, r *http.Request) {
	tokenStr := r.URL.Query().Get("token")
	driverID, err := parseDriverID(tokenStr)
	if err != nil || driverID == "" {
		http.Error(w, `{"code":"401","message":"invalid token"}`, http.StatusUnauthorized)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		slog.Error("upgrade failed", "error", err)
		return
	}

	client := &Client{conn: conn, driverID: driverID}
	hub.add(client)
	slog.Info("client connected", "driver_id", driverID)

	defer func() {
		hub.remove(conn)
		conn.Close()
		slog.Info("client disconnected", "driver_id", driverID)
		// Broadcast updated positions (without this driver)
		hub.broadcast(map[string]any{
			"type":    "truck_positions",
			"payload": hub.allPositions(),
		})
	}()

	// Welcome: send current positions
	conn.WriteJSON(map[string]any{
		"type":      "connected",
		"server":    "logi-go-ws",
		"driver_id": driverID,
		"payload":   hub.allPositions(),
	})

	conn.SetReadDeadline(time.Now().Add(90 * time.Second))
	conn.SetPongHandler(func(string) error {
		conn.SetReadDeadline(time.Now().Add(90 * time.Second))
		return nil
	})

	// Heartbeat
	go func() {
		ticker := time.NewTicker(30 * time.Second)
		defer ticker.Stop()
		for range ticker.C {
			if err := conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}()

	for {
		_, raw, err := conn.ReadMessage()
		if err != nil {
			break
		}
		conn.SetReadDeadline(time.Now().Add(90 * time.Second))

		var msg Message
		if json.Unmarshal(raw, &msg) != nil {
			continue
		}

		switch msg.Type {
		case "ping":
			conn.WriteJSON(map[string]string{"type": "pong"})

		case "location_update":
			var body struct {
				Lat      float64 `json:"lat"`
				Lng      float64 `json:"lng"`
				SpeedKmh float64 `json:"speed_kmh"`
				Heading  float64 `json:"heading"`
			}
			if json.Unmarshal(msg.Payload, &body) == nil {
				hub.updatePosition(TruckPos{
					DriverID:  driverID,
					Lat:       body.Lat,
					Lng:       body.Lng,
					SpeedKmh:  body.SpeedKmh,
					Heading:   body.Heading,
					UpdatedAt: time.Now().UTC().Format(time.RFC3339),
				})
			}
		}
	}
}

// ── Redis pub/sub ─────────────────────────────────────────────────────────────

func startRedisSub() {
	if rdb == nil {
		return
	}
	go func() {
		sub := rdb.Subscribe(context.Background(), "logi-go:alerts", "logi-go:events")
		ch := sub.Channel()
		for msg := range ch {
			var payload map[string]any
			if json.Unmarshal([]byte(msg.Payload), &payload) == nil {
				msgType, _ := payload["type"].(string)
				if driverID, ok := payload["driver_id"].(string); ok && driverID != "" {
					// Route to specific driver
					hub.sendTo(driverID, payload)
				} else {
					// Broadcast to all (earthquake alerts etc.)
					slog.Info("broadcasting redis event", "type", msgType)
					hub.broadcast(payload)
				}
			}
		}
	}()
}

// ── Dev mock broadcaster ──────────────────────────────────────────────────────

func startMockBroadcaster() {
	if env("AUTO_FIRE", "false") != "true" {
		return
	}
	interval := 60 * time.Second
	ticker := time.NewTicker(interval)
	for range ticker.C {
		hub.broadcast(map[string]any{
			"type": "earthquake_alert",
			"payload": map[string]any{
				"magnitude": 6.2,
				"epicenter": "駿河湾",
				"depth_km":  40,
				"intensity": "震度5強",
				"tsunami":   false,
				"s_wave_seconds": 28,
				"issued_at": time.Now().Format(time.RFC3339),
			},
		})
	}
}

// ── Main ──────────────────────────────────────────────────────────────────────

func handleHealth(w http.ResponseWriter, r *http.Request) {
	hub.mu.RLock()
	count := len(hub.clients)
	hub.mu.RUnlock()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"status":            "ok",
		"connected_clients": count,
		"redis":             rdb != nil,
	})
}

// handleFireAlert is a dev endpoint to manually trigger an earthquake alert
func handleFireAlert(w http.ResponseWriter, r *http.Request) {
	if env("ENV", "development") != "development" {
		http.Error(w, "forbidden", http.StatusForbidden)
		return
	}
	hub.broadcast(map[string]any{
		"type": "earthquake_alert",
		"payload": map[string]any{
			"magnitude":      6.2,
			"epicenter":      "駿河湾",
			"depth_km":       40,
			"intensity":      "震度5強",
			"tsunami":        false,
			"s_wave_seconds": 28,
			"issued_at":      time.Now().Format(time.RFC3339),
		},
	})
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "fired"})
}

func main() {
	port := env("PORT", "8765")

	initRedis()
	startRedisSub()
	go startMockBroadcaster()

	mux := http.NewServeMux()
	mux.HandleFunc("/ws", handleWS)
	mux.HandleFunc("/health", handleHealth)
	mux.HandleFunc("POST /dev/fire-alert", handleFireAlert)

	slog.Info("ws-server starting", "port", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		slog.Error("server failed", "error", err)
		os.Exit(1)
	}
}
