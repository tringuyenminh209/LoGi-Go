package middleware

import (
	"net/http"
	"strings"
)

// ValidateJSON returns middleware that limits the request body size to maxBytes.
// If the body exceeds maxBytes, it returns 413 Request Entity Too Large.
func ValidateJSON(maxBytes int64) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Body != nil && r.ContentLength > maxBytes {
				http.Error(w, `{"code":"413","message":"request body too large"}`, http.StatusRequestEntityTooLarge)
				return
			}
			// Wrap body with a size-limited reader regardless of Content-Length header
			// to guard against chunked transfers or missing Content-Length.
			r.Body = http.MaxBytesReader(w, r.Body, maxBytes)
			next.ServeHTTP(w, r)
		})
	}
}

// SanitizeString trims whitespace and truncates s to maxLen runes.
func SanitizeString(s string, maxLen int) string {
	s = strings.TrimSpace(s)
	runes := []rune(s)
	if len(runes) > maxLen {
		return string(runes[:maxLen])
	}
	return s
}
