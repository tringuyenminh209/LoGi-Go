package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"

	"github.com/logi-go/api-gateway/cache"
	"github.com/logi-go/api-gateway/db"
	"github.com/logi-go/api-gateway/handler"
	"github.com/logi-go/api-gateway/middleware"
)

func env(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func main() {
	ctx := context.Background()

	// Connect to Redis (non-fatal in dev mode)
	if err := cache.Init(ctx); err != nil {
		slog.Warn("redis unavailable, pre-computed proposals disabled", "error", err)
	} else {
		slog.Info("redis connected")
	}

	// Connect to PostgreSQL (non-fatal in dev mode)
	if err := db.Init(ctx); err != nil {
		if env("ENV", "development") == "development" {
			slog.Warn("postgres unavailable, running in mock mode", "error", err)
		} else {
			slog.Error("postgres init failed", "error", err)
			os.Exit(1)
		}
	} else {
		defer db.Close()
	}

	mux := http.NewServeMux()
	auth := middleware.RequireAuth

	// Health
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		handler.JSON(w, 200, map[string]string{
			"status":  "ok",
			"service": "api-gateway",
			"env":     env("ENV", "development"),
		})
	})

	// Auth
	mux.HandleFunc("POST /api/v1/auth/login", handler.Login)
	mux.HandleFunc("POST /api/v1/auth/refresh", handler.Refresh)
	mux.HandleFunc("POST /api/v1/auth/logout", auth(handler.Logout))

	// Driver profile
	mux.HandleFunc("GET /api/v1/driver/profile", auth(handler.GetProfile))
	mux.HandleFunc("PATCH /api/v1/driver/profile", auth(handler.PatchProfile))
	mux.HandleFunc("POST /api/v1/driver/location", auth(handler.UpdateLocation))

	// Shipments
	mux.HandleFunc("GET /api/v1/shipments", auth(handler.ListShipments))
	mux.HandleFunc("GET /api/v1/shipments/{id}", auth(handler.GetShipment))
	mux.HandleFunc("POST /api/v1/deliveries/events", auth(handler.DeliveryEvent))

	// Match engine
	mux.HandleFunc("GET /api/v1/match/proposals", auth(handler.ListProposals))
	mux.HandleFunc("POST /api/v1/match/{id}/accept", auth(handler.AcceptMatch))
	mux.HandleFunc("POST /api/v1/match/{id}/decline", auth(handler.DeclineMatch))

	// Notifications
	mux.HandleFunc("GET /api/v1/notifications", auth(handler.ListNotifications))
	mux.HandleFunc("PUT /api/v1/notifications/read-all", auth(handler.MarkAllRead))
	mux.HandleFunc("PUT /api/v1/notifications/{id}/read", auth(handler.MarkRead))
	mux.HandleFunc("POST /api/v1/notifications/fcm-token", auth(handler.RegisterFCM))

	// Safety
	mux.HandleFunc("GET /api/v1/safety/current", auth(handler.SafetyCurrent))
	mux.HandleFunc("POST /api/v1/safety/alerts/{id}/ack", auth(handler.SafetyAck))

	// OCR
	mux.HandleFunc("POST /api/v1/ocr/upload", auth(handler.OcrUpload))
	mux.HandleFunc("GET /api/v1/ocr/review-queue", auth(handler.OcrReviewQueue))
	mux.HandleFunc("GET /api/v1/ocr/jobs/{id}", auth(handler.GetOcrJob))
	mux.HandleFunc("POST /api/v1/ocr/jobs/{id}/confirm", auth(handler.ConfirmOcrJob))
	mux.HandleFunc("POST /api/v1/ocr/jobs/{id}/reject", auth(handler.RejectOcrJob))

	// Carbon & Certifications
	mux.HandleFunc("GET /api/v1/carbon/summary", auth(handler.CarbonSummary))
	mux.HandleFunc("GET /api/v1/certifications", auth(handler.ListCertifications))

	// Debug
	mux.HandleFunc("POST /api/v1/debug/trigger-match", func(w http.ResponseWriter, r *http.Request) {
		handler.JSON(w, 200, map[string]string{"status": "match triggered (mock)"})
	})

	port := env("PORT", "8443")
	corsOrigins := env("CORS_ORIGINS", "http://localhost:5173")

	slog.Info("api-gateway starting", "port", port, "env", env("ENV", "development"))
	if err := http.ListenAndServe(":"+port, middleware.CORS(corsOrigins)(mux)); err != nil {
		slog.Error("server failed", "error", err)
		os.Exit(1)
	}
}
