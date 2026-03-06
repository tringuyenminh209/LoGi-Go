package handler

import (
	"encoding/json"
	"net/http"

	"github.com/logi-go/api-gateway/db"
	"github.com/logi-go/api-gateway/middleware"
)

func GetProfile(w http.ResponseWriter, r *http.Request) {
	driverID := middleware.DriverID(r)
	ctx := r.Context()

	var id, tenantID string
	var metaBytes, truckMetaBytes []byte
	err := db.Pool.QueryRow(ctx, `
		SELECT d.id, d.tenant_id, d.metadata,
		       COALESCE(t.metadata, '{}'::jsonb) AS truck_meta
		FROM entities d
		LEFT JOIN entities t
		       ON t.id = (d.metadata->>'truck_id')::uuid AND t.type = 'truck'
		WHERE d.id = $1 AND d.type = 'driver' AND d.is_active = TRUE
	`, driverID).Scan(&id, &tenantID, &metaBytes, &truckMetaBytes)

	if err != nil {
		if Env("ENV", "development") == "development" {
			JSON(w, http.StatusOK, devProfile())
			return
		}
		Err(w, "driver not found", http.StatusNotFound)
		return
	}

	var meta, truck map[string]any
	json.Unmarshal(metaBytes, &meta)
	json.Unmarshal(truckMetaBytes, &truck)

	plate := strOr(truck, "plate", "不明")
	vtype := "トラック"
	if m, ok := truck["manufacturer"].(string); ok {
		if mod, ok2 := truck["model"].(string); ok2 {
			vtype = m + " " + mod
		} else {
			vtype = m
		}
	}

	JSON(w, http.StatusOK, map[string]any{
		"id":               id,
		"tenant_id":        tenantID,
		"name":             meta["name"],
		"email":            meta["email"],
		"vehicle_type":     vtype,
		"vehicle_plate":    plate,
		"status":           "on_delivery",
		"rating":           meta["rating"],
		"total_deliveries": meta["total_trips"],
		"co2_saved_kg":     2800.5,
	})
}

func PatchProfile(w http.ResponseWriter, r *http.Request) {
	driverID := middleware.DriverID(r)
	ctx := r.Context()

	var updates map[string]any
	if err := DecodeBody(r, &updates); err != nil {
		Err(w, "invalid request", http.StatusBadRequest)
		return
	}

	updatesJSON, _ := json.Marshal(updates)
	_, err := db.Pool.Exec(ctx, `
		UPDATE entities
		SET metadata = metadata || $1::jsonb
		WHERE id = $2 AND type = 'driver'
	`, string(updatesJSON), driverID)

	if err != nil {
		Err(w, "update failed", http.StatusInternalServerError)
		return
	}
	GetProfile(w, r)
}

func UpdateLocation(w http.ResponseWriter, r *http.Request) {
	// Location updates go to ws-server via WebSocket; REST endpoint is fire-and-forget
	w.WriteHeader(http.StatusNoContent)
}

// ── helpers ──────────────────────────────────────────────────────────────────

func strOr(m map[string]any, key, def string) string {
	if v, ok := m[key].(string); ok {
		return v
	}
	return def
}

func devProfile() map[string]any {
	return map[string]any{
		"id":               "aaaaaaaa-0000-0000-0000-000000000001",
		"tenant_id":        "11111111-0000-0000-0000-000000000001",
		"name":             "田中太郎",
		"email":            "tanaka@logi-go.jp",
		"vehicle_type":     "HINO レンジャー",
		"vehicle_plate":    "大阪11あ1234",
		"status":           "on_delivery",
		"rating":           4.8,
		"total_deliveries": 1247,
		"co2_saved_kg":     2800.5,
	}
}
