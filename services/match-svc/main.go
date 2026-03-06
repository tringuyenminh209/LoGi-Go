package main

import (
	"log/slog"
	"net"
	"net/http"
	"os"
)

func env(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

func main() {
	grpcPort := env("GRPC_PORT", "50054")

	go func() {
		mux := http.NewServeMux()
		mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
			w.Write([]byte(`{"status":"ok","service":"match-svc"}`))
		})
		http.ListenAndServe(":8080", mux)
	}()

	ln, err := net.Listen("tcp", ":"+grpcPort)
	if err != nil {
		slog.Error("listen failed", "port", grpcPort, "error", err)
		os.Exit(1)
	}
	slog.Info("match-svc skeleton listening", "grpc_port", grpcPort)
	for {
		conn, err := ln.Accept()
		if err != nil {
			continue
		}
		go conn.Close()
	}
}
