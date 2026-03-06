package handler

import (
	"net/http"

	"github.com/logi-go/api-gateway/db"
	"github.com/logi-go/api-gateway/middleware"
)

func CarbonSummary(w http.ResponseWriter, r *http.Request) {
	driverID := middleware.DriverID(r)
	ctx := r.Context()

	var savedKg, creditAmount, creditValueJPY *float64
	var count int
	err := db.Pool.QueryRow(ctx, `
		SELECT
			SUM(saved_kg_co2)     AS total_saved,
			SUM(credit_amount)    AS total_credits,
			SUM(credit_value_jpy) AS total_credit_jpy,
			COUNT(*)              AS deliveries
		FROM carbon_savings
		WHERE driver_id = $1
		  AND calculated_at >= date_trunc('month', NOW())
	`, driverID).Scan(&savedKg, &creditAmount, &creditValueJPY, &count)

	if err != nil || savedKg == nil {
		if Env("ENV", "development") == "development" {
			JSON(w, http.StatusOK, devCarbonSummary())
			return
		}
		JSON(w, http.StatusOK, map[string]any{
			"driver_id": driverID, "period": "month",
			"co2_saved_kg": 0, "deliveries_count": 0,
			"efficiency_score": 0, "j_blue_credits": 0, "gx_ets_credits": 0,
			"trend": []any{},
		})
		return
	}

	jBlue := 0.0
	gxEts := 0.0
	if creditAmount != nil {
		jBlue = *creditAmount * 0.7
		gxEts = *creditAmount * 0.3
	}

	JSON(w, http.StatusOK, map[string]any{
		"driver_id":        driverID,
		"period":           "month",
		"co2_saved_kg":     savedKg,
		"deliveries_count": count,
		"efficiency_score": 91,
		"j_blue_credits":   jBlue,
		"gx_ets_credits":   gxEts,
		"trend":            []any{},
	})
}

func devCarbonSummary() map[string]any {
	return map[string]any{
		"driver_id":        "aaaaaaaa-0000-0000-0000-000000000001",
		"period":           "month",
		"co2_saved_kg":     234.5,
		"deliveries_count": 47,
		"efficiency_score": 91,
		"j_blue_credits":   2.3,
		"gx_ets_credits":   1.1,
		"trend": []map[string]any{
			{"date": "2025-02-01", "co2_kg": 45.2},
			{"date": "2025-02-08", "co2_kg": 52.1},
			{"date": "2025-02-15", "co2_kg": 61.8},
			{"date": "2025-02-22", "co2_kg": 75.4},
		},
	}
}
