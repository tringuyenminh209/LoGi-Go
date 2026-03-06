package middleware

import (
	"context"
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const (
	ContextDriverID contextKey = "driver_id"
	ContextTenantID contextKey = "tenant_id"
)

func jwtSecret() []byte {
	s := os.Getenv("JWT_SECRET")
	if s == "" {
		s = "dev-secret-change-in-production"
	}
	return []byte(s)
}

func WriteJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	// Use encoding/json in handlers directly to avoid import cycle
	_ = v
}

// RequireAuth validates Bearer JWT and injects driver_id into context.
func RequireAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		raw := r.Header.Get("Authorization")
		if !strings.HasPrefix(raw, "Bearer ") {
			http.Error(w, `{"code":"401","message":"unauthorized"}`, http.StatusUnauthorized)
			return
		}
		tokenStr := strings.TrimPrefix(raw, "Bearer ")

		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (any, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, jwt.ErrSignatureInvalid
			}
			return jwtSecret(), nil
		})
		if err != nil || !token.Valid {
			http.Error(w, `{"code":"401","message":"invalid token"}`, http.StatusUnauthorized)
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			http.Error(w, `{"code":"401","message":"invalid claims"}`, http.StatusUnauthorized)
			return
		}

		driverID, _ := claims["sub"].(string)
		tenantID, _ := claims["tid"].(string)

		ctx := context.WithValue(r.Context(), ContextDriverID, driverID)
		ctx = context.WithValue(ctx, ContextTenantID, tenantID)
		next(w, r.WithContext(ctx))
	}
}

func DriverID(r *http.Request) string {
	v, _ := r.Context().Value(ContextDriverID).(string)
	return v
}

func TenantID(r *http.Request) string {
	v, _ := r.Context().Value(ContextTenantID).(string)
	return v
}

func CORS(origins string) func(http.Handler) http.Handler {
	allowed := origins + ",http://localhost:5174"
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")
			for _, o := range strings.Split(allowed, ",") {
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
}
