package main

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"strconv"
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

type EarthquakePayload struct {
	Magnitude float64 `json:"magnitude"`
	Epicenter string  `json:"epicenter"`
	Depth     int     `json:"depth"`
	Intensity string  `json:"intensity"`
	Tsunami   bool    `json:"tsunami"`
	IssuedAt  string  `json:"issued_at"`
}

var (
	mu      sync.RWMutex
	clients = make(map[*websocket.Conn]struct{})
)

func addClient(c *websocket.Conn) {
	mu.Lock()
	clients[c] = struct{}{}
	mu.Unlock()
}

func removeClient(c *websocket.Conn) {
	mu.Lock()
	delete(clients, c)
	mu.Unlock()
}

func broadcast(payload EarthquakePayload) {
	data, _ := json.Marshal(map[string]any{"type": "earthquake", "payload": payload})
	mu.RLock()
	defer mu.RUnlock()
	for c := range clients {
		c.WriteMessage(websocket.TextMessage, data)
	}
	slog.Info("earthquake broadcasted", "magnitude", payload.Magnitude, "epicenter", payload.Epicenter, "clients", len(clients))
}

// WS endpoint — resilience-svc connects here
func handleWS(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		return
	}
	addClient(conn)
	slog.Info("resilience-svc connected")
	defer func() {
		removeClient(conn)
		conn.Close()
	}()
	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			break
		}
	}
}

// HTTP POST /fire — triggered by `make earthquake`
func handleFire(w http.ResponseWriter, r *http.Request) {
	var p EarthquakePayload
	if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
		http.Error(w, "bad request", 400)
		return
	}
	p.IssuedAt = time.Now().Format(time.RFC3339)
	go broadcast(p)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "fired", "epicenter": p.Epicenter})
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	mu.RLock()
	count := len(clients)
	mu.RUnlock()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{"status": "ok", "ws_clients": count})
}

func main() {
	port := env("PORT", "9999")
	autoFire := env("AUTO_FIRE", "false") == "true"
	intervalSec, _ := strconv.Atoi(env("AUTO_FIRE_INTERVAL", "60"))

	mux := http.NewServeMux()
	mux.HandleFunc("/ws", handleWS)
	mux.HandleFunc("/fire", handleFire)
	mux.HandleFunc("/health", handleHealth)

	if autoFire {
		go func() {
			ticker := time.NewTicker(time.Duration(intervalSec) * time.Second)
			for range ticker.C {
				broadcast(EarthquakePayload{
					Magnitude: 5.5, Epicenter: "相模湾", Depth: 30,
					Intensity: "4", Tsunami: false,
					IssuedAt: time.Now().Format(time.RFC3339),
				})
			}
		}()
		slog.Info("auto-fire enabled", "interval_sec", intervalSec)
	}

	slog.Info("jma-mock starting", "port", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		slog.Error("server failed", "error", err)
		os.Exit(1)
	}
}
