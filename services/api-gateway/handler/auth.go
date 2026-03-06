package handler

import (
	"net/http"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/logi-go/api-gateway/db"
	"golang.org/x/crypto/bcrypt"
)

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

func jwtSecret() []byte {
	s := os.Getenv("JWT_SECRET")
	if s == "" {
		s = "dev-secret-change-in-production"
	}
	return []byte(s)
}

func signToken(driverID, tenantID string, expiry time.Duration) (string, error) {
	claims := jwt.MapClaims{
		"sub": driverID,
		"tid": tenantID,
		"exp": time.Now().Add(expiry).Unix(),
		"iat": time.Now().Unix(),
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(jwtSecret())
}

func Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := DecodeBody(r, &req); err != nil || req.Email == "" {
		Err(w, "リクエストが不正です", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	isDev := Env("ENV", "development") == "development"

	// Query driver entity by email
	row := db.Pool.QueryRow(ctx, `
		SELECT id, tenant_id, metadata
		FROM entities
		WHERE metadata->>'email' = $1
		  AND type = 'driver'
		  AND is_active = TRUE
		LIMIT 1
	`, req.Email)

	var driverID, tenantID string
	var metadata map[string]any
	if err := row.Scan(&driverID, &tenantID, &metadata); err != nil {
		// In dev mode with no DB data yet: return mock token
		if isDev {
			returnDevToken(w, req.Email)
			return
		}
		Err(w, "メールアドレスまたはパスワードが正しくありません", http.StatusUnauthorized)
		return
	}

	// Password verification
	if !isDev {
		hash, _ := metadata["password_hash"].(string)
		if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(req.Password)); err != nil {
			Err(w, "メールアドレスまたはパスワードが正しくありません", http.StatusUnauthorized)
			return
		}
	}

	accessToken, err := signToken(driverID, tenantID, 24*time.Hour)
	if err != nil {
		Err(w, "トークン生成に失敗しました", http.StatusInternalServerError)
		return
	}
	refreshToken, _ := signToken(driverID, tenantID, 30*24*time.Hour)

	JSON(w, http.StatusOK, map[string]any{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"expires_in":    86400,
		"token_type":    "Bearer",
		"driver":        buildDriverResponse(driverID, tenantID, metadata),
	})
}

func Refresh(w http.ResponseWriter, r *http.Request) {
	var req struct {
		RefreshToken string `json:"refresh_token"`
	}
	DecodeBody(r, &req)

	token, err := jwt.Parse(req.RefreshToken, func(t *jwt.Token) (any, error) {
		return jwtSecret(), nil
	})
	if err != nil || !token.Valid {
		Err(w, "リフレッシュトークンが無効です", http.StatusUnauthorized)
		return
	}
	claims, _ := token.Claims.(jwt.MapClaims)
	driverID, _ := claims["sub"].(string)
	tenantID, _ := claims["tid"].(string)

	accessToken, _ := signToken(driverID, tenantID, 24*time.Hour)
	newRefresh, _ := signToken(driverID, tenantID, 30*24*time.Hour)

	JSON(w, http.StatusOK, map[string]any{
		"access_token":  accessToken,
		"refresh_token": newRefresh,
		"expires_in":    86400,
		"token_type":    "Bearer",
	})
}

func Logout(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNoContent)
}

// ── helpers ──────────────────────────────────────────────────────────────────

func buildDriverResponse(id, tenantID string, meta map[string]any) map[string]any {
	return map[string]any{
		"id":               id,
		"tenant_id":        tenantID,
		"name":             meta["name"],
		"email":            meta["email"],
		"vehicle_type":     "4tトラック",
		"vehicle_plate":    "品川 300 あ 1234",
		"status":           "on_delivery",
		"rating":           meta["rating"],
		"total_deliveries": meta["total_trips"],
		"co2_saved_kg":     2800.5,
	}
}

func returnDevToken(w http.ResponseWriter, email string) {
	const devDriverID = "aaaaaaaa-0000-0000-0000-000000000001"
	const devTenantID = "11111111-0000-0000-0000-000000000001"
	accessToken, _ := signToken(devDriverID, devTenantID, 24*time.Hour)
	refreshToken, _ := signToken(devDriverID, devTenantID, 30*24*time.Hour)
	JSON(w, http.StatusOK, map[string]any{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"expires_in":    86400,
		"token_type":    "Bearer",
		"driver": map[string]any{
			"id":               devDriverID,
			"name":             "田中太郎",
			"email":            email,
			"vehicle_type":     "HINO レンジャー",
			"vehicle_plate":    "大阪11あ1234",
			"status":           "on_delivery",
			"rating":           4.8,
			"total_deliveries": 1247,
			"co2_saved_kg":     2800.5,
		},
	})
}
