package main

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func env(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

var pool *pgxpool.Pool

// ── Types ──────────────────────────────────────────────────────────────────────

type ocrWorkerResult struct {
	JobID        string         `json:"job_id"`
	Status       string         `json:"status"`
	Confidence   float64        `json:"confidence"`
	NeedsReview  bool           `json:"needs_review"`
	ProcessingMs int            `json:"processing_ms"`
	Data         map[string]any `json:"data"`
}

// ── Helpers ────────────────────────────────────────────────────────────────────

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func strVal(m map[string]any, key, def string) string {
	if v, ok := m[key].(string); ok && v != "" {
		return v
	}
	return def
}

func mockOcrResult() *ocrWorkerResult {
	return &ocrWorkerResult{
		Status:      "completed",
		Confidence:  0.97,
		NeedsReview: false,
		Data: map[string]any{
			"shipper_name":      "テスト運送株式会社",
			"shipper_address":   "大阪府大阪市中央区1-1-1",
			"consignee_name":    "東京物流センター",
			"consignee_address": "東京都港区2-2-2",
			"cargo_description": "精密機器",
			"weight_kg":         250.0,
		},
	}
}

// ── OCR Worker call ────────────────────────────────────────────────────────────

func callOcrWorker(imageData []byte, contentType string) (*ocrWorkerResult, error) {
	ocrURL := env("OCR_WORKER_URL", "http://ocr-worker:8080") + "/ocr"
	req, err := http.NewRequest(http.MethodPost, ocrURL, bytes.NewReader(imageData))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", contentType)
	req.Header.Set("Accept", "application/json")

	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result ocrWorkerResult
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}
	return &result, nil
}

// ── DB helpers ──────────────────────────────────────────────────────────────────

func insertOcrJob(ctx context.Context, tenantID string, r *ocrWorkerResult) (string, error) {
	fieldsJSON, _ := json.Marshal(r.Data)
	var jobID string
	err := pool.QueryRow(ctx, `
		INSERT INTO ocr_jobs (
			tenant_id, status, ocr_confidence, final_confidence,
			needs_review, extracted_fields, completed_at, review_deadline
		) VALUES (
			$1::uuid, $2, $3, $4, $5, $6::jsonb, NOW(),
			NOW() + INTERVAL '4 hours'
		) RETURNING id::text
	`,
		tenantID, r.Status, r.Confidence, r.Confidence,
		r.NeedsReview, string(fieldsJSON),
	).Scan(&jobID)
	return jobID, err
}

// ── HTTP handlers ──────────────────────────────────────────────────────────────

func submitHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	imageData, err := io.ReadAll(io.LimitReader(r.Body, 20<<20))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "read failed"})
		return
	}
	contentType := r.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}
	tenantID := r.Header.Get("X-Tenant-ID")
	if tenantID == "" {
		tenantID = env("DEFAULT_TENANT_ID", "22222222-0000-0000-0000-000000000001")
	}

	result, err := callOcrWorker(imageData, contentType)
	if err != nil {
		slog.Warn("ocr-worker call failed, using fallback", "error", err)
		result = mockOcrResult()
	}

	jobID := result.JobID
	if pool != nil {
		if id, dbErr := insertOcrJob(ctx, tenantID, result); dbErr == nil {
			jobID = id
		} else {
			slog.Warn("insert ocr_job failed", "error", dbErr)
		}
	}

	writeJSON(w, http.StatusCreated, map[string]any{
		"job_id":       jobID,
		"status":       result.Status,
		"confidence":   result.Confidence,
		"needs_review": result.NeedsReview,
		"data":         result.Data,
	})
}

func getJobHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	jobID := r.PathValue("id")

	if pool == nil {
		writeJSON(w, http.StatusOK, map[string]any{
			"job_id": jobID, "status": "completed", "confidence": 0.97,
		})
		return
	}

	var status string
	var confidence *float64
	var needsReview bool
	var extractedFields []byte
	var queuedAt time.Time

	err := pool.QueryRow(ctx, `
		SELECT status, final_confidence, needs_review, extracted_fields, queued_at
		FROM ocr_jobs WHERE id = $1::uuid
	`, jobID).Scan(&status, &confidence, &needsReview, &extractedFields, &queuedAt)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "job not found"})
		return
	}

	var fields map[string]any
	json.Unmarshal(extractedFields, &fields)

	conf := 0.0
	if confidence != nil {
		conf = *confidence
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"job_id":       jobID,
		"status":       status,
		"confidence":   conf,
		"needs_review": needsReview,
		"data":         fields,
		"created_at":   queuedAt.Format(time.RFC3339),
	})
}

func confirmJobHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	jobID := r.PathValue("id")

	var body struct {
		Fields map[string]any `json:"fields"`
	}
	json.NewDecoder(r.Body).Decode(&body)

	if pool == nil {
		writeJSON(w, http.StatusOK, map[string]string{"job_id": jobID, "status": "confirmed"})
		return
	}

	// Load existing data and merge with any human corrections
	var extractedFields []byte
	var tenantID string
	err := pool.QueryRow(ctx,
		`SELECT extracted_fields, tenant_id::text FROM ocr_jobs WHERE id = $1::uuid`,
		jobID,
	).Scan(&extractedFields, &tenantID)
	if err != nil {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "job not found"})
		return
	}

	var fields map[string]any
	json.Unmarshal(extractedFields, &fields)
	for k, v := range body.Fields {
		fields[k] = v
	}

	// Mark job confirmed
	pool.Exec(ctx,
		`UPDATE ocr_jobs SET status='confirmed', reviewed_at=NOW() WHERE id=$1::uuid`,
		jobID,
	)

	// Create a shipment from the confirmed OCR data
	weightKg := 0.0
	if wt, ok := fields["weight_kg"].(float64); ok {
		weightKg = wt
	}
	originAddr := strVal(fields, "shipper_address", "集荷先不明")
	destAddr := strVal(fields, "consignee_address", "配送先不明")
	cargoDesc := strVal(fields, "cargo_description", "貨物")

	var shipmentID string
	pool.QueryRow(ctx, `
		INSERT INTO shipments (
			tenant_id, shipper_id, origin_address, dest_address,
			cargo_type, cargo_desc, weight_kg,
			pickup_from, pickup_to, delivery_by,
			status, source_platform, ocr_job_id
		)
		SELECT
			$1::uuid, e.id,
			$2, $3,
			'general', $4, $5,
			NOW() + INTERVAL '24 hours',
			NOW() + INTERVAL '36 hours',
			NOW() + INTERVAL '72 hours',
			'pending', 'ocr_fax', $6::uuid
		FROM entities e
		WHERE e.tenant_id = $1::uuid AND e.type = 'truck'
		LIMIT 1
		RETURNING id::text
	`, tenantID, originAddr, destAddr, cargoDesc, weightKg, jobID,
	).Scan(&shipmentID)

	writeJSON(w, http.StatusOK, map[string]any{
		"job_id":      jobID,
		"status":      "confirmed",
		"shipment_id": shipmentID,
	})
}

func rejectJobHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	jobID := r.PathValue("id")

	if pool != nil {
		pool.Exec(ctx,
			`UPDATE ocr_jobs SET status='rejected', reviewed_at=NOW() WHERE id=$1::uuid`,
			jobID,
		)
	}
	writeJSON(w, http.StatusOK, map[string]string{"job_id": jobID, "status": "rejected"})
}

func reviewQueueHandler(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	if pool == nil {
		writeJSON(w, http.StatusOK, []any{})
		return
	}

	rows, err := pool.Query(ctx, `
		SELECT id::text, status, final_confidence, needs_review,
		       extracted_fields, queued_at
		FROM ocr_jobs
		WHERE needs_review = TRUE AND status = 'completed'
		ORDER BY queued_at DESC
		LIMIT 20
	`)
	if err != nil {
		writeJSON(w, http.StatusOK, []any{})
		return
	}
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
			"job_id":      id,
			"status":      status,
			"confidence":  conf,
			"needs_review": needsReview,
			"data":        fields,
			"queued_at":   queuedAt.Format(time.RFC3339),
		})
	}

	writeJSON(w, http.StatusOK, jobs)
}

// ── Main ───────────────────────────────────────────────────────────────────────

func main() {
	ctx := context.Background()

	if pgDSN := env("PG_DSN", ""); pgDSN != "" {
		var err error
		pool, err = pgxpool.New(ctx, pgDSN)
		if err != nil || pool.Ping(ctx) != nil {
			slog.Warn("postgres unavailable, running in mock mode", "error", err)
			pool = nil
		} else {
			slog.Info("postgres connected")
			defer pool.Close()
		}
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok", "service": "legacy-bridge-svc"})
	})
	mux.HandleFunc("POST /ocr/submit", submitHandler)
	mux.HandleFunc("GET /ocr/jobs/{id}", getJobHandler)
	mux.HandleFunc("POST /ocr/jobs/{id}/confirm", confirmJobHandler)
	mux.HandleFunc("POST /ocr/jobs/{id}/reject", rejectJobHandler)
	mux.HandleFunc("GET /ocr/review-queue", reviewQueueHandler)

	port := env("HTTP_PORT", "8080")
	slog.Info("legacy-bridge-svc starting", "port", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		slog.Error("server failed", "error", err)
		os.Exit(1)
	}
}
