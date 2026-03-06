package main

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"strings"
	"time"
)

func env(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

var (
	port        = env("PORT", "8443")
	corsOrigins = env("CORS_ORIGINS", "http://localhost:5173") + ",http://localhost:5174"
)

// ── helpers ─────────────────────────────────────────────────────────────────

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func apiErr(w http.ResponseWriter, msg string, status int) {
	writeJSON(w, status, map[string]string{"code": fmt.Sprintf("%d", status), "message": msg})
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		for _, o := range strings.Split(corsOrigins, ",") {
			if strings.TrimSpace(o) == origin {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				break
			}
		}
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Max-Age", "86400")
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func authMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !strings.HasPrefix(r.Header.Get("Authorization"), "Bearer ") {
			apiErr(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		next(w, r)
	}
}

// ── mock data ────────────────────────────────────────────────────────────────

var mockProfile = map[string]any{
	"id":               "driver-001",
	"name":             "田中太郎",
	"license_number":   "東京123456789",
	"license_expiry":   "2027-03-31",
	"vehicle_type":     "4tトラック",
	"vehicle_plate":    "品川 300 あ 1234",
	"current_location": map[string]float64{"lat": 35.6762, "lng": 139.6503},
	"status":           "on_delivery",
	"rating":           4.9,
	"total_deliveries": 1247,
	"co2_saved_kg":     2800.5,
	"tenant_id":        "tenant-001",
}

var mockShipments = []map[string]any{
	{
		"id":     "LG-2847",
		"status": "in_transit",
		"pickup": map[string]any{
			"name":    "大阪物流センター",
			"address": "大阪府大阪市中央区1-1-1",
			"lat":     34.6937, "lng": 135.5023,
			"contact": "06-1234-5678",
		},
		"dropoff": map[string]any{
			"name":    "東京港区倉庫",
			"address": "東京都港区2-2-2",
			"lat":     35.6580, "lng": 139.7454,
			"contact": "03-9876-5432",
		},
		"cargo_type":         "精密機器",
		"weight_kg":          3500,
		"volume_m3":          12.5,
		"scheduled_pickup":   "2025-03-06T09:00:00+09:00",
		"estimated_delivery": "2025-03-07T17:00:00+09:00",
		"distance_km":        520,
		"fee_jpy":            85000,
		"shipper_name":       "テスト運送株式会社",
		"co2_saved_kg":       42.3,
	},
}

var mockProposals = []map[string]any{
	{
		"match_id": "M-9274",
		"shipment": map[string]any{
			"id":     "SH-4501",
			"status": "pending",
			"pickup": map[string]any{
				"name":    "大阪市中央区",
				"address": "大阪府大阪市中央区3-3-3",
				"lat":     34.6937, "lng": 135.5023,
			},
			"dropoff": map[string]any{
				"name":    "東京都港区",
				"address": "東京都港区4-4-4",
				"lat":     35.6580, "lng": 139.7454,
			},
			"cargo_type": "精密機器",
			"weight_kg":  3500,
			"fee_jpy":    85000,
		},
		"score":                  0.94,
		"distance_to_pickup_km":  2.3,
		"estimated_earnings_jpy": 85000,
		"co2_reduction_kg":       42.3,
		"expires_at":             time.Now().Add(15 * time.Minute).Format(time.RFC3339),
	},
	{
		"match_id": "M-9275",
		"shipment": map[string]any{
			"id":     "SH-4502",
			"status": "pending",
			"pickup": map[string]any{
				"name":    "神戸市中央区",
				"address": "兵庫県神戸市中央区5-5-5",
				"lat":     34.6901, "lng": 135.1956,
			},
			"dropoff": map[string]any{
				"name":    "名古屋市中村区",
				"address": "愛知県名古屋市中村区6-6-6",
				"lat":     35.1709, "lng": 136.8815,
			},
			"cargo_type": "食品",
			"weight_kg":  1200,
			"fee_jpy":    42000,
		},
		"score":                  0.87,
		"distance_to_pickup_km":  5.1,
		"estimated_earnings_jpy": 42000,
		"co2_reduction_kg":       18.7,
		"expires_at":             time.Now().Add(12 * time.Minute).Format(time.RFC3339),
	},
}

var mockNotifications = []map[string]any{
	{
		"id":         "notif-001",
		"type":       "match_proposal",
		"title":      "新しい配送マッチング",
		"body":       "大阪→東京 3500kg ¥85,000 — 15分以内に回答してください",
		"read":       false,
		"created_at": time.Now().Add(-5 * time.Minute).Format(time.RFC3339),
		"data":       map[string]string{"match_id": "M-9274"},
	},
	{
		"id":         "notif-002",
		"type":       "delivery_update",
		"title":      "配送状況更新",
		"body":       "LG-2847 が東名高速道路を通過しました",
		"read":       false,
		"created_at": time.Now().Add(-30 * time.Minute).Format(time.RFC3339),
		"data":       map[string]string{"shipment_id": "LG-2847"},
	},
	{
		"id":         "notif-003",
		"type":       "system",
		"title":      "システムメンテナンス",
		"body":       "3月10日 02:00-04:00 にメンテナンスを予定しています",
		"read":       false,
		"created_at": time.Now().Add(-2 * time.Hour).Format(time.RFC3339),
		"data":       map[string]string{},
	},
}

var mockCarbonSummary = map[string]any{
	"driver_id":       "driver-001",
	"period":          "month",
	"co2_saved_kg":    234.5,
	"deliveries_count": 47,
	"efficiency_score": 91,
	"j_blue_credits":  2.3,
	"gx_ets_credits":  1.1,
	"trend": []map[string]any{
		{"date": "2025-02-01", "co2_kg": 45.2},
		{"date": "2025-02-08", "co2_kg": 52.1},
		{"date": "2025-02-15", "co2_kg": 61.8},
		{"date": "2025-02-22", "co2_kg": 75.4},
	},
}

var mockCertifications = []map[string]any{
	{
		"id":          "cert-001",
		"name":        "危険物取扱者乙種4類",
		"issuer":      "消防試験研究センター",
		"issued_date": "2022-08-15",
		"expiry_date": "2027-08-14",
		"status":      "active",
	},
	{
		"id":          "cert-002",
		"name":        "フォークリフト運転技能講習",
		"issuer":      "労働安全衛生法認定機関",
		"issued_date": "2021-04-20",
		"status":      "active",
	},
	{
		"id":          "cert-003",
		"name":        "エコドライブ認定ドライバー",
		"issuer":      "一般社団法人エコドライブ普及連絡会",
		"issued_date": "2024-01-10",
		"expiry_date": "2026-01-09",
		"status":      "active",
	},
}

// ── handlers ─────────────────────────────────────────────────────────────────

func handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, 200, map[string]string{"status": "ok", "service": "api-gateway", "env": env("ENV", "development")})
}

func handleLogin(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, 200, map[string]any{
		"access_token":  fmt.Sprintf("dev-access-%d", time.Now().Unix()),
		"refresh_token": "dev-refresh-token",
		"expires_in":    86400,
		"token_type":    "Bearer",
	})
}

func handleRefresh(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, 200, map[string]any{
		"access_token":  fmt.Sprintf("dev-access-%d", time.Now().Unix()),
		"refresh_token": "dev-refresh-token",
		"expires_in":    86400,
		"token_type":    "Bearer",
	})
}

func handleLogout(w http.ResponseWriter, r *http.Request)        { w.WriteHeader(204) }
func handleGetProfile(w http.ResponseWriter, r *http.Request)    { writeJSON(w, 200, mockProfile) }
func handleUpdateProfile(w http.ResponseWriter, r *http.Request) { writeJSON(w, 200, mockProfile) }
func handleUpdateLocation(w http.ResponseWriter, r *http.Request) { w.WriteHeader(204) }

func handleListShipments(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, 200, map[string]any{
		"data": mockShipments, "total": len(mockShipments),
		"page": 1, "per_page": 20, "has_more": false,
	})
}

func handleGetShipment(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	for _, s := range mockShipments {
		if s["id"] == id {
			writeJSON(w, 200, s)
			return
		}
	}
	apiErr(w, "shipment not found", 404)
}

func handleDeliveryEvent(w http.ResponseWriter, r *http.Request) { w.WriteHeader(204) }

func handleListProposals(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, 200, mockProposals)
}

func handleAcceptMatch(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, 200, mockShipments[0])
}

func handleDeclineMatch(w http.ResponseWriter, r *http.Request) { w.WriteHeader(204) }

func handleListNotifications(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, 200, map[string]any{
		"data": mockNotifications, "total": len(mockNotifications),
		"page": 1, "per_page": 20, "has_more": false,
	})
}

func handleMarkRead(w http.ResponseWriter, r *http.Request)    { w.WriteHeader(204) }
func handleMarkAllRead(w http.ResponseWriter, r *http.Request) { w.WriteHeader(204) }
func handleRegisterFCM(w http.ResponseWriter, r *http.Request) { w.WriteHeader(204) }

func handleSafetyCurrent(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, 200, map[string]any{
		"earthquake":          nil,
		"active_warnings":     []string{},
		"road_closures":       []any{},
		"recommended_actions": []string{},
	})
}

func handleSafetyAck(w http.ResponseWriter, r *http.Request) { w.WriteHeader(204) }

func handleOcrUpload(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, 200, map[string]any{
		"job_id":     fmt.Sprintf("ocr-%d", time.Now().Unix()),
		"status":     "completed",
		"confidence": 0.97,
		"created_at": time.Now().Format(time.RFC3339),
		"extracted_data": map[string]any{
			"shipper_name":     "テスト運送株式会社",
			"shipper_address":  "大阪府大阪市中央区1-1-1",
			"consignee_name":   "東京物流センター",
			"consignee_address": "東京都港区2-2-2",
			"cargo_description": "精密機器",
			"weight_kg":        250.0,
		},
	})
}

func handleGetOcrJob(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	writeJSON(w, 200, map[string]any{
		"job_id": id, "status": "completed", "confidence": 0.97,
		"created_at": time.Now().Format(time.RFC3339),
	})
}

func handleConfirmOcrJob(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, 200, mockShipments[0])
}

func handleCarbonSummary(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, 200, mockCarbonSummary)
}

func handleCertifications(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, 200, mockCertifications)
}

// ── debug endpoints ──────────────────────────────────────────────────────────

func handleTriggerMatch(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, 200, map[string]string{"status": "match triggered (mock)"})
}

// ── main ─────────────────────────────────────────────────────────────────────

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("GET /health", handleHealth)

	// Auth
	mux.HandleFunc("POST /api/v1/auth/login", handleLogin)
	mux.HandleFunc("POST /api/v1/auth/refresh", handleRefresh)
	mux.HandleFunc("POST /api/v1/auth/logout", authMiddleware(handleLogout))

	// Driver profile
	mux.HandleFunc("GET /api/v1/driver/profile", authMiddleware(handleGetProfile))
	mux.HandleFunc("PATCH /api/v1/driver/profile", authMiddleware(handleUpdateProfile))
	mux.HandleFunc("POST /api/v1/driver/location", authMiddleware(handleUpdateLocation))

	// Shipments
	mux.HandleFunc("GET /api/v1/shipments", authMiddleware(handleListShipments))
	mux.HandleFunc("GET /api/v1/shipments/{id}", authMiddleware(handleGetShipment))
	mux.HandleFunc("POST /api/v1/deliveries/events", authMiddleware(handleDeliveryEvent))

	// Match engine
	mux.HandleFunc("GET /api/v1/match/proposals", authMiddleware(handleListProposals))
	mux.HandleFunc("POST /api/v1/match/{id}/accept", authMiddleware(handleAcceptMatch))
	mux.HandleFunc("POST /api/v1/match/{id}/decline", authMiddleware(handleDeclineMatch))

	// Notifications
	mux.HandleFunc("GET /api/v1/notifications", authMiddleware(handleListNotifications))
	mux.HandleFunc("PUT /api/v1/notifications/read-all", authMiddleware(handleMarkAllRead))
	mux.HandleFunc("PUT /api/v1/notifications/{id}/read", authMiddleware(handleMarkRead))
	mux.HandleFunc("POST /api/v1/notifications/fcm-token", authMiddleware(handleRegisterFCM))

	// Safety
	mux.HandleFunc("GET /api/v1/safety/current", authMiddleware(handleSafetyCurrent))
	mux.HandleFunc("POST /api/v1/safety/alerts/{id}/ack", authMiddleware(handleSafetyAck))

	// OCR
	mux.HandleFunc("POST /api/v1/ocr/upload", authMiddleware(handleOcrUpload))
	mux.HandleFunc("GET /api/v1/ocr/jobs/{id}", authMiddleware(handleGetOcrJob))
	mux.HandleFunc("POST /api/v1/ocr/jobs/{id}/confirm", authMiddleware(handleConfirmOcrJob))

	// Carbon & Certifications
	mux.HandleFunc("GET /api/v1/carbon/summary", authMiddleware(handleCarbonSummary))
	mux.HandleFunc("GET /api/v1/certifications", authMiddleware(handleCertifications))

	// Debug
	mux.HandleFunc("POST /api/v1/debug/trigger-match", handleTriggerMatch)

	slog.Info("api-gateway starting", "port", port, "env", env("ENV", "development"))
	if err := http.ListenAndServe(":"+port, corsMiddleware(mux)); err != nil {
		slog.Error("server failed", "error", err)
		os.Exit(1)
	}
}
