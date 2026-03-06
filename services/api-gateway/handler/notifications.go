package handler

import (
	"net/http"
	"time"

	"github.com/logi-go/api-gateway/db"
	"github.com/logi-go/api-gateway/middleware"
)

func ListNotifications(w http.ResponseWriter, r *http.Request) {
	driverID := middleware.DriverID(r)
	ctx := r.Context()

	rows, err := db.Pool.Query(ctx, `
		SELECT id, type, title, message, read, action_data, created_at
		FROM notifications
		WHERE driver_id = $1
		ORDER BY created_at DESC
		LIMIT 50
	`, driverID)

	if err != nil {
		if Env("ENV", "development") == "development" {
			JSON(w, http.StatusOK, devNotificationsPage())
			return
		}
		Err(w, "query failed", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	list := []map[string]any{}
	for rows.Next() {
		var id, ntype, title, message string
		var read bool
		var actionDataBytes []byte
		var createdAt time.Time

		if err := rows.Scan(&id, &ntype, &title, &message, &read, &actionDataBytes, &createdAt); err != nil {
			continue
		}

		list = append(list, map[string]any{
			"id":         id,
			"type":       ntype,
			"title":      title,
			"body":       message,
			"read":       read,
			"created_at": createdAt.Format(time.RFC3339),
			"data":       actionDataBytes,
		})
	}

	JSON(w, http.StatusOK, map[string]any{
		"data":     list,
		"total":    len(list),
		"page":     1,
		"per_page": 50,
		"has_more": false,
	})
}

func MarkRead(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	driverID := middleware.DriverID(r)
	ctx := r.Context()

	db.Pool.Exec(ctx, `
		UPDATE notifications SET read = TRUE
		WHERE id = $1 AND driver_id = $2
	`, id, driverID)

	w.WriteHeader(http.StatusNoContent)
}

func MarkAllRead(w http.ResponseWriter, r *http.Request) {
	driverID := middleware.DriverID(r)
	ctx := r.Context()

	db.Pool.Exec(ctx, `
		UPDATE notifications SET read = TRUE WHERE driver_id = $1
	`, driverID)

	w.WriteHeader(http.StatusNoContent)
}

func RegisterFCM(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Token string `json:"token"`
	}
	if err := DecodeBody(r, &req); err != nil || req.Token == "" {
		Err(w, "invalid request", http.StatusBadRequest)
		return
	}

	driverID := middleware.DriverID(r)
	ctx := r.Context()

	db.Pool.Exec(ctx, `
		UPDATE entities
		SET metadata = metadata || jsonb_build_object('fcm_token', $1)
		WHERE id = $2 AND type = 'driver'
	`, req.Token, driverID)

	w.WriteHeader(http.StatusNoContent)
}

func devNotificationsPage() map[string]any {
	return map[string]any{
		"data": []map[string]any{
			{
				"id": "notif-001", "type": "match",
				"title": "新着マッチ提案", "body": "大阪→東京 精密機器 85,000円 スコア92%",
				"read": false, "created_at": time.Now().Add(-5 * time.Minute).Format(time.RFC3339),
				"data": map[string]string{"match_id": "cccccccc-0000-0000-0000-000000000001"},
			},
			{
				"id": "notif-002", "type": "carbon",
				"title": "CO₂削減達成", "body": "今月のCO₂削減量が280kgを達成しました！",
				"read": false, "created_at": time.Now().Add(-30 * time.Minute).Format(time.RFC3339),
				"data": map[string]string{},
			},
		},
		"total": 2, "page": 1, "per_page": 50, "has_more": false,
	}
}
