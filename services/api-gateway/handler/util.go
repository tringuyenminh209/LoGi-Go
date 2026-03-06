package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

func Env(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func JSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func Err(w http.ResponseWriter, msg string, status int) {
	JSON(w, status, map[string]string{
		"code":    fmt.Sprintf("%d", status),
		"message": msg,
	})
}

func DecodeBody(r *http.Request, v any) error {
	return json.NewDecoder(r.Body).Decode(v)
}
