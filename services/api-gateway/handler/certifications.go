package handler

import (
	"net/http"
	"time"

	"github.com/logi-go/api-gateway/db"
	"github.com/logi-go/api-gateway/middleware"
)

func ListCertifications(w http.ResponseWriter, r *http.Request) {
	driverID := middleware.DriverID(r)
	ctx := r.Context()

	rows, err := db.Pool.Query(ctx, `
		SELECT id, name, status, expires, issued_at
		FROM driver_certifications
		WHERE driver_id = $1
		ORDER BY status, expires ASC
	`, driverID)

	if err != nil {
		if Env("ENV", "development") == "development" {
			JSON(w, http.StatusOK, devCertifications())
			return
		}
		Err(w, "query failed", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	list := []map[string]any{}
	for rows.Next() {
		var id, name, status string
		var expires, issuedAt *time.Time

		if err := rows.Scan(&id, &name, &status, &expires, &issuedAt); err != nil {
			continue
		}

		c := map[string]any{
			"id":     id,
			"name":   name,
			"status": status,
		}
		if expires != nil {
			c["expiry_date"] = expires.Format("2006-01-02")
		}
		if issuedAt != nil {
			c["issued_date"] = issuedAt.Format("2006-01-02")
		}
		list = append(list, c)
	}

	JSON(w, http.StatusOK, list)
}

func devCertifications() []map[string]any {
	return []map[string]any{
		{"id": "cert-001", "name": "大型自動車免許", "status": "active", "expiry_date": "2028-03-15", "issued_date": "2018-03-15"},
		{"id": "cert-002", "name": "冷蔵・冷凍車資格", "status": "active", "expiry_date": "2026-12-31"},
		{"id": "cert-003", "name": "フォークリフト免許", "status": "active", "expiry_date": "2027-06-30"},
		{"id": "cert-004", "name": "危険物取扱者乙4種", "status": "expired", "expiry_date": "2024-01-15"},
	}
}
