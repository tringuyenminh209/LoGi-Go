package handler

import (
	"net/http"
	"time"

	"github.com/logi-go/api-gateway/db"
)

// DashboardStats returns aggregated stats for the admin dashboard.
// GET /api/v1/admin/dashboard/stats
func DashboardStats(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	if db.Pool != nil {
		var totalShipments, pendingCount, inTransitCount, totalDrivers int
		var avgLoadFactor, totalCO2Saved *float64

		err := db.Pool.QueryRow(ctx, `
			SELECT
				COUNT(*)                                          AS total_shipments,
				COUNT(*) FILTER (WHERE status = 'pending')        AS pending_count,
				COUNT(*) FILTER (WHERE status = 'in_transit')     AS in_transit_count
			FROM shipments
		`).Scan(&totalShipments, &pendingCount, &inTransitCount)

		if err == nil {
			_ = db.Pool.QueryRow(ctx, `
				SELECT COUNT(*) FROM entities WHERE type = 'driver' AND is_active = TRUE
			`).Scan(&totalDrivers)

			_ = db.Pool.QueryRow(ctx, `
				SELECT AVG(load_factor), SUM(saved_kg_co2)
				FROM carbon_savings
				WHERE calculated_at >= date_trunc('month', NOW())
			`).Scan(&avgLoadFactor, &totalCO2Saved)

			alf := 0.0
			if avgLoadFactor != nil {
				alf = *avgLoadFactor
			}
			co2 := 0.0
			if totalCO2Saved != nil {
				co2 = *totalCO2Saved
			}

			JSON(w, http.StatusOK, map[string]any{
				"total_shipments":  totalShipments,
				"pending_count":    pendingCount,
				"in_transit_count": inTransitCount,
				"total_drivers":    totalDrivers,
				"avg_load_factor":  alf,
				"total_co2_saved":  co2,
				"period":           "month",
				"generated_at":     time.Now().Format(time.RFC3339),
			})
			return
		}
	}

	// Dev mock fallback
	JSON(w, http.StatusOK, map[string]any{
		"total_shipments":  156,
		"pending_count":    23,
		"in_transit_count": 42,
		"total_drivers":    38,
		"avg_load_factor":  0.74,
		"total_co2_saved":  1284.5,
		"period":           "month",
		"generated_at":     time.Now().Format(time.RFC3339),
	})
}

// ListDrivers returns all driver entities with their metadata.
// GET /api/v1/admin/drivers
func ListDrivers(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	if db.Pool != nil {
		rows, err := db.Pool.Query(ctx, `
			SELECT
				e.id::text,
				COALESCE(e.metadata->>'name', '')           AS name,
				COALESCE(e.metadata->>'vehicle_type', '')   AS vehicle_type,
				COALESCE(e.metadata->>'vehicle_plate', '')  AS vehicle_plate,
				COALESCE((e.metadata->>'rating')::float, 0) AS rating,
				COALESCE(e.metadata->>'status', 'offline')  AS status,
				e.is_active,
				e.created_at
			FROM entities e
			WHERE e.type = 'driver'
			ORDER BY e.created_at DESC
		`)
		if err == nil {
			defer rows.Close()
			var drivers []map[string]any
			for rows.Next() {
				var id, name, vehicleType, vehiclePlate, status string
				var rating float64
				var isActive bool
				var createdAt time.Time

				if err := rows.Scan(&id, &name, &vehicleType, &vehiclePlate, &rating, &status, &isActive, &createdAt); err != nil {
					continue
				}
				drivers = append(drivers, map[string]any{
					"id":            id,
					"name":          name,
					"vehicle_type":  vehicleType,
					"vehicle_plate": vehiclePlate,
					"rating":        rating,
					"status":        status,
					"is_active":     isActive,
					"created_at":    createdAt.Format(time.RFC3339),
				})
			}
			if drivers == nil {
				drivers = []map[string]any{}
			}
			JSON(w, http.StatusOK, map[string]any{
				"data":  drivers,
				"total": len(drivers),
			})
			return
		}
	}

	// Dev mock fallback
	JSON(w, http.StatusOK, map[string]any{
		"data": []map[string]any{
			{
				"id":            "aaaaaaaa-0000-0000-0000-000000000001",
				"name":          "田中太郎",
				"vehicle_type":  "4tトラック",
				"vehicle_plate": "品川 300 あ 1234",
				"rating":        4.9,
				"status":        "on_delivery",
				"is_active":     true,
				"created_at":    "2025-01-15T09:00:00Z",
			},
			{
				"id":            "aaaaaaaa-0000-0000-0000-000000000002",
				"name":          "鈴木花子",
				"vehicle_type":  "10tトラック",
				"vehicle_plate": "大阪 500 い 5678",
				"rating":        4.7,
				"status":        "available",
				"is_active":     true,
				"created_at":    "2025-02-01T10:30:00Z",
			},
		},
		"total": 2,
	})
}

// ListTenants returns all tenants.
// GET /api/v1/admin/tenants
func ListTenants(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	if db.Pool != nil {
		rows, err := db.Pool.Query(ctx, `
			SELECT id::text, name, type, plan, is_active, created_at
			FROM tenants
			ORDER BY created_at DESC
		`)
		if err == nil {
			defer rows.Close()
			var tenants []map[string]any
			for rows.Next() {
				var id, name, tenantType, plan string
				var isActive bool
				var createdAt time.Time

				if err := rows.Scan(&id, &name, &tenantType, &plan, &isActive, &createdAt); err != nil {
					continue
				}
				tenants = append(tenants, map[string]any{
					"id":         id,
					"name":       name,
					"type":       tenantType,
					"plan":       plan,
					"is_active":  isActive,
					"created_at": createdAt.Format(time.RFC3339),
				})
			}
			if tenants == nil {
				tenants = []map[string]any{}
			}
			JSON(w, http.StatusOK, map[string]any{
				"data":  tenants,
				"total": len(tenants),
			})
			return
		}
	}

	// Dev mock fallback
	JSON(w, http.StatusOK, map[string]any{
		"data": []map[string]any{
			{
				"id":        "bbbbbbbb-0000-0000-0000-000000000001",
				"name":      "田中商事株式会社",
				"type":      "shipper",
				"plan":      "enterprise",
				"is_active": true,
				"created_at": "2025-01-01T00:00:00Z",
			},
			{
				"id":        "bbbbbbbb-0000-0000-0000-000000000002",
				"name":      "大阪物流センター",
				"type":      "warehouse",
				"plan":      "standard",
				"is_active": true,
				"created_at": "2025-01-10T00:00:00Z",
			},
			{
				"id":        "bbbbbbbb-0000-0000-0000-000000000003",
				"name":      "関西運送株式会社",
				"type":      "carrier",
				"plan":      "standard",
				"is_active": true,
				"created_at": "2025-02-01T00:00:00Z",
			},
		},
		"total": 3,
	})
}
