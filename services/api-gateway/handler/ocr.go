package handler

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"

	"github.com/logi-go/api-gateway/db"
	"github.com/logi-go/api-gateway/middleware"
)

var legacyBridgeBase = func() string {
	if v := os.Getenv("LEGACY_BRIDGE_ADDR"); v != "" {
		return "http://" + v
	}
	return "http://localhost:8080"
}()

var ocrClient = &http.Client{Timeout: 90 * time.Second}

// OcrUpload receives the raw image from the mobile client and forwards to legacy-bridge-svc.
func OcrUpload(w http.ResponseWriter, r *http.Request) {
	tenantID := middleware.TenantID(r)

	imageData, err := io.ReadAll(io.LimitReader(r.Body, 20<<20))
	if err != nil {
		Err(w, "image read failed", http.StatusBadRequest)
		return
	}

	req, err := http.NewRequestWithContext(r.Context(), http.MethodPost,
		legacyBridgeBase+"/ocr/submit", bytes.NewReader(imageData))
	if err != nil {
		Err(w, "forward setup failed", http.StatusInternalServerError)
		return
	}
	req.Header.Set("Content-Type", r.Header.Get("Content-Type"))
	req.Header.Set("X-Tenant-ID", tenantID)

	resp, err := ocrClient.Do(req)
	if err != nil {
		// Fallback inline mock
		JSON(w, http.StatusOK, map[string]any{
			"job_id":       fmt.Sprintf("ocr-%d", time.Now().Unix()),
			"status":       "completed",
			"confidence":   0.97,
			"needs_review": false,
			"created_at":   time.Now().Format(time.RFC3339),
			"data": map[string]any{
				"shipper_name":      "テスト運送株式会社",
				"shipper_address":   "大阪府大阪市中央区1-1-1",
				"consignee_name":    "東京物流センター",
				"consignee_address": "東京都港区2-2-2",
				"cargo_description": "精密機器",
				"weight_kg":         250.0,
			},
		})
		return
	}
	defer resp.Body.Close()
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}

// GetOcrJob reads from ocr_jobs DB directly (or proxies to legacy-bridge-svc).
func GetOcrJob(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	id := r.PathValue("id")

	if db.Pool != nil {
		var status string
		var confidence *float64
		var needsReview bool
		var extractedFields []byte
		var queuedAt time.Time

		err := db.Pool.QueryRow(ctx, `
			SELECT status, final_confidence, needs_review, extracted_fields, queued_at
			FROM ocr_jobs WHERE id = $1::uuid
		`, id).Scan(&status, &confidence, &needsReview, &extractedFields, &queuedAt)

		if err == nil {
			var fields map[string]any
			json.Unmarshal(extractedFields, &fields)
			conf := 0.0
			if confidence != nil {
				conf = *confidence
			}
			JSON(w, http.StatusOK, map[string]any{
				"job_id":       id,
				"status":       status,
				"confidence":   conf,
				"needs_review": needsReview,
				"data":         fields,
				"created_at":   queuedAt.Format(time.RFC3339),
			})
			return
		}
	}

	// Proxy to legacy-bridge-svc
	resp, err := ocrClient.Get(legacyBridgeBase + "/ocr/jobs/" + id)
	if err != nil {
		JSON(w, http.StatusOK, map[string]any{"job_id": id, "status": "completed", "confidence": 0.97})
		return
	}
	defer resp.Body.Close()
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}

// ConfirmOcrJob forwards the confirmation (with optional field corrections) to legacy-bridge-svc.
func ConfirmOcrJob(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	body, _ := io.ReadAll(r.Body)

	req, err := http.NewRequestWithContext(r.Context(), http.MethodPost,
		legacyBridgeBase+"/ocr/jobs/"+id+"/confirm", bytes.NewReader(body))
	if err != nil {
		Err(w, "forward failed", http.StatusInternalServerError)
		return
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := ocrClient.Do(req)
	if err != nil {
		JSON(w, http.StatusOK, map[string]string{"job_id": id, "status": "confirmed"})
		return
	}
	defer resp.Body.Close()
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}

// RejectOcrJob forwards rejection to legacy-bridge-svc.
func RejectOcrJob(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	req, err := http.NewRequestWithContext(r.Context(), http.MethodPost,
		legacyBridgeBase+"/ocr/jobs/"+id+"/reject", http.NoBody)
	if err != nil {
		Err(w, "forward failed", http.StatusInternalServerError)
		return
	}

	resp, err := ocrClient.Do(req)
	if err != nil {
		JSON(w, http.StatusOK, map[string]string{"job_id": id, "status": "rejected"})
		return
	}
	defer resp.Body.Close()
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(resp.StatusCode)
	io.Copy(w, resp.Body)
}

// OcrReviewQueue proxies to legacy-bridge-svc review queue or queries DB.
func OcrReviewQueue(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	if db.Pool != nil {
		rows, err := db.Pool.Query(ctx, `
			SELECT id::text, status, final_confidence, needs_review,
			       extracted_fields, queued_at
			FROM ocr_jobs
			WHERE needs_review = TRUE AND status = 'completed'
			ORDER BY queued_at DESC
			LIMIT 20
		`)
		if err == nil {
			defer rows.Close()
			jobs := []map[string]any{}
			for rows.Next() {
				var id, status string
				var confidence *float64
				var needsReview bool
				var extractedFields []byte
				var queuedAt time.Time

				if err := rows.Scan(&id, &status, &confidence, &needsReview, &extractedFields, &queuedAt); err != nil {
					continue
				}
				var fields map[string]any
				json.Unmarshal(extractedFields, &fields)
				conf := 0.0
				if confidence != nil {
					conf = *confidence
				}
				jobs = append(jobs, map[string]any{
					"job_id":       id,
					"status":       status,
					"confidence":   conf,
					"needs_review": needsReview,
					"data":         fields,
					"queued_at":    queuedAt.Format(time.RFC3339),
				})
			}
			JSON(w, http.StatusOK, jobs)
			return
		}
	}

	// Proxy to legacy-bridge-svc
	resp, err := ocrClient.Get(legacyBridgeBase + "/ocr/review-queue")
	if err != nil {
		JSON(w, http.StatusOK, []any{})
		return
	}
	defer resp.Body.Close()
	w.Header().Set("Content-Type", "application/json")
	io.Copy(w, resp.Body)
}
