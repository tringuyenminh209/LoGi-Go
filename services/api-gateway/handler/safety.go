package handler

import (
	"net/http"
)

func SafetyCurrent(w http.ResponseWriter, r *http.Request) {
	JSON(w, http.StatusOK, map[string]any{
		"earthquake":          nil,
		"active_warnings":     []string{},
		"road_closures":       []any{},
		"recommended_actions": []string{},
	})
}

func SafetyAck(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNoContent)
}
