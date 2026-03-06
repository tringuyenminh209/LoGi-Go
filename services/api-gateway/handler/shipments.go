package handler

import (
	"net/http"
	"time"

	"github.com/logi-go/api-gateway/db"
	"github.com/logi-go/api-gateway/middleware"
)

func ListShipments(w http.ResponseWriter, r *http.Request) {
	driverID := middleware.DriverID(r)
	ctx := r.Context()

	rows, err := db.Pool.Query(ctx, `
		SELECT
			s.id, s.status,
			s.origin_address,  s.dest_address,
			s.cargo_type,      s.cargo_desc,
			s.weight_kg,       s.volume_m3,
			s.pickup_from,     s.delivery_by,
			s.reward_jpy,      s.est_co2_kg,
			COALESCE(t.name, '') AS shipper_name
		FROM shipments s
		JOIN tenants t ON t.id = s.tenant_id
		WHERE s.matched_truck_id = (
			SELECT (metadata->>'truck_id')::uuid
			FROM entities WHERE id = $1 AND type = 'driver'
		)
		ORDER BY s.pickup_from DESC
		LIMIT 50
	`, driverID)

	if err != nil {
		if Env("ENV", "development") == "development" {
			JSON(w, http.StatusOK, devShipmentsPage())
			return
		}
		Err(w, "query failed", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var list []map[string]any
	for rows.Next() {
		var id, status, origin, dest, cargoType, cargoDesc, shipperName string
		var weightKg float64
		var volumeM3, rewardJPY, co2 *float64
		var pickupFrom, deliveryBy time.Time

		if err := rows.Scan(
			&id, &status, &origin, &dest,
			&cargoType, &cargoDesc,
			&weightKg, &volumeM3,
			&pickupFrom, &deliveryBy,
			&rewardJPY, &co2,
			&shipperName,
		); err != nil {
			continue
		}

		list = append(list, map[string]any{
			"id":     id,
			"status": status,
			"pickup": map[string]any{
				"name":    origin,
				"address": origin,
			},
			"dropoff": map[string]any{
				"name":    dest,
				"address": dest,
			},
			"cargo_type":         cargoType,
			"cargo_desc":         cargoDesc,
			"weight_kg":          weightKg,
			"volume_m3":          volumeM3,
			"scheduled_pickup":   pickupFrom.Format(time.RFC3339),
			"estimated_delivery": deliveryBy.Format(time.RFC3339),
			"fee_jpy":            rewardJPY,
			"co2_saved_kg":       co2,
			"shipper_name":       shipperName,
		})
	}

	if list == nil {
		list = []map[string]any{}
	}
	JSON(w, http.StatusOK, map[string]any{
		"data":     list,
		"total":    len(list),
		"page":     1,
		"per_page": 50,
		"has_more": false,
	})
}

func GetShipment(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	ctx := r.Context()

	var sid, status, origin, dest, cargoType, cargoDesc, shipperName string
	var weightKg float64
	var volumeM3, rewardJPY, co2 *float64
	var pickupFrom, deliveryBy time.Time

	err := db.Pool.QueryRow(ctx, `
		SELECT
			s.id, s.status,
			s.origin_address, s.dest_address,
			s.cargo_type, s.cargo_desc,
			s.weight_kg, s.volume_m3,
			s.pickup_from, s.delivery_by,
			s.reward_jpy, s.est_co2_kg,
			COALESCE(t.name, '') AS shipper_name
		FROM shipments s
		JOIN tenants t ON t.id = s.tenant_id
		WHERE s.id = $1
	`, id).Scan(
		&sid, &status, &origin, &dest,
		&cargoType, &cargoDesc,
		&weightKg, &volumeM3,
		&pickupFrom, &deliveryBy,
		&rewardJPY, &co2,
		&shipperName,
	)

	if err != nil {
		Err(w, "shipment not found", http.StatusNotFound)
		return
	}

	JSON(w, http.StatusOK, map[string]any{
		"id":     sid,
		"status": status,
		"pickup": map[string]any{
			"name":    origin,
			"address": origin,
		},
		"dropoff": map[string]any{
			"name":    dest,
			"address": dest,
		},
		"cargo_type":         cargoType,
		"cargo_desc":         cargoDesc,
		"weight_kg":          weightKg,
		"volume_m3":          volumeM3,
		"scheduled_pickup":   pickupFrom.Format(time.RFC3339),
		"estimated_delivery": deliveryBy.Format(time.RFC3339),
		"fee_jpy":            rewardJPY,
		"co2_saved_kg":       co2,
		"shipper_name":       shipperName,
	})
}

func DeliveryEvent(w http.ResponseWriter, r *http.Request) {
	// Delivery events are handled by the ws-server; REST is fire-and-forget
	w.WriteHeader(http.StatusNoContent)
}

func devShipmentsPage() map[string]any {
	return map[string]any{
		"data": []map[string]any{
			{
				"id":     "dddddddd-0000-0000-0000-000000000001",
				"status": "in_transit",
				"pickup": map[string]any{"name": "大阪市中央区", "address": "大阪市中央区"},
				"dropoff": map[string]any{"name": "東京都港区", "address": "東京都港区"},
				"cargo_type":         "dry",
				"cargo_desc":         "精密機器",
				"weight_kg":          3500,
				"volume_m3":          12,
				"scheduled_pickup":   time.Now().Add(-2 * time.Hour).Format(time.RFC3339),
				"estimated_delivery": time.Now().Add(22 * time.Hour).Format(time.RFC3339),
				"fee_jpy":            85000,
				"co2_saved_kg":       25.2,
				"shipper_name":       "田中商事㈱",
			},
		},
		"total": 1, "page": 1, "per_page": 50, "has_more": false,
	}
}
