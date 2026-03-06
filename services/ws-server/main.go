package main

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

func env(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

type Hub struct {
	mu      sync.RWMutex
	clients map[*websocket.Conn]string // conn → driverID
}

func newHub() *Hub { return &Hub{clients: make(map[*websocket.Conn]string)} }

func (h *Hub) add(conn *websocket.Conn, driverID string) {
	h.mu.Lock()
	h.clients[conn] = driverID
	h.mu.Unlock()
}

func (h *Hub) remove(conn *websocket.Conn) {
	h.mu.Lock()
	delete(h.clients, conn)
	h.mu.Unlock()
}

func (h *Hub) broadcast(msg any) {
	data, _ := json.Marshal(msg)
	h.mu.RLock()
	defer h.mu.RUnlock()
	for conn := range h.clients {
		conn.WriteMessage(websocket.TextMessage, data)
	}
}

var hub = newHub()

func handleWS(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		slog.Error("upgrade failed", "error", err)
		return
	}
	driverID := r.URL.Query().Get("driver_id")
	hub.add(conn, driverID)
	slog.Info("client connected", "driver_id", driverID)

	defer func() {
		hub.remove(conn)
		conn.Close()
		slog.Info("client disconnected", "driver_id", driverID)
	}()

	// Send welcome ping
	conn.WriteJSON(map[string]string{"type": "connected", "server": "logi-go-ws"})

	for {
		_, msg, err := conn.ReadMessage()
		if err != nil {
			break
		}
		var payload map[string]any
		if json.Unmarshal(msg, &payload) == nil {
			if payload["type"] == "ping" {
				conn.WriteJSON(map[string]string{"type": "pong"})
			}
		}
	}
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	hub.mu.RLock()
	count := len(hub.clients)
	hub.mu.RUnlock()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{"status": "ok", "connected_clients": count})
}

// dev: broadcast a test earthquake alert every 60s if AUTO_FIRE=true
func startMockBroadcaster() {
	if env("AUTO_FIRE", "false") != "true" {
		return
	}
	ticker := time.NewTicker(60 * time.Second)
	for range ticker.C {
		hub.broadcast(map[string]any{
			"type": "earthquake_alert",
			"payload": map[string]any{
				"magnitude": 6.2, "epicenter": "駿河湾", "depth_km": 40,
				"intensity": "5強", "tsunami": false,
				"issued_at": time.Now().Format(time.RFC3339),
			},
		})
	}
}

func main() {
	port := env("PORT", "8765")

	mux := http.NewServeMux()
	mux.HandleFunc("/ws", handleWS)
	mux.HandleFunc("/health", handleHealth)

	go startMockBroadcaster()

	slog.Info("ws-server starting", "port", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		slog.Error("server failed", "error", err)
		os.Exit(1)
	}
}
