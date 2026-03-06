.PHONY: help dev up down logs migrate migrate-down seed gen-keys proto \
        test test-integration build ps clean frontend

SHELL := /bin/bash
COMPOSE := docker compose
MIGRATE := docker compose run --rm migrate

# ─────────────────────────────────────────────
# Help
# ─────────────────────────────────────────────
help:
	@echo ""
	@echo "  Logi-Go — Available commands"
	@echo ""
	@echo "  Infrastructure"
	@echo "    make dev           Start all services (build if needed)"
	@echo "    make up            Start services (no rebuild)"
	@echo "    make down          Stop all services"
	@echo "    make ps            Show running containers"
	@echo "    make logs          Tail all logs"
	@echo "    make logs s=<svc>  Tail logs for specific service"
	@echo ""
	@echo "  Database"
	@echo "    make migrate       Run all pending migrations"
	@echo "    make migrate-down  Rollback last migration"
	@echo "    make seed          Seed development data"
	@echo ""
	@echo "  Development"
	@echo "    make gen-keys      Generate JWT RS256 key pair"
	@echo "    make proto         Generate Go stubs from .proto files"
	@echo "    make frontend      Start mobile app (hot reload, :5173)"
	@echo "    make web           Start web dashboard (hot reload, :5174)"
	@echo "    make install       Install all workspace deps"
	@echo ""
	@echo "  Testing"
	@echo "    make test          Run unit tests"
	@echo "    make test-api      Run API integration tests"
	@echo "    make earthquake    Fire mock JMA earthquake alert"
	@echo ""
	@echo "  Build"
	@echo "    make build         Build all Docker images"
	@echo "    make clean         Remove volumes and images"
	@echo ""

# ─────────────────────────────────────────────
# Infrastructure
# ─────────────────────────────────────────────
dev: .env secrets/jwt_private.pem
	$(COMPOSE) up --build -d
	@echo ""
	@echo "  ✅ Logi-Go is running!"
	@echo ""
	@echo "  📱 Mobile App  → http://localhost:5173"
	@echo "  🖥️  Web Dashboard → http://localhost:5174"
	@echo "  🔌 API Gateway → http://localhost:8443"
	@echo "  🔴 Redis UI    → http://localhost:8001"
	@echo "  📦 MinIO       → http://localhost:9090"
	@echo "  🔍 Jaeger      → http://localhost:16686"
	@echo "  📊 Grafana     → http://localhost:3000"
	@echo ""

up:
	$(COMPOSE) up -d

down:
	$(COMPOSE) down

ps:
	$(COMPOSE) ps

logs:
ifdef s
	$(COMPOSE) logs -f $(s)
else
	$(COMPOSE) logs -f
endif

build:
	$(COMPOSE) build

clean:
	$(COMPOSE) down -v --rmi local
	rm -rf secrets/

# ─────────────────────────────────────────────
# Database
# ─────────────────────────────────────────────
migrate: .env
	$(COMPOSE) run --rm migrate -path /migrations -database "$$PG_DSN" up

migrate-down: .env
	$(COMPOSE) run --rm migrate -path /migrations -database "$$PG_DSN" down 1

seed:
	$(COMPOSE) exec postgres psql -U logigo -d logigo -f /seeds/dev_seed.sql
	@echo "✅ Development data seeded"

# ─────────────────────────────────────────────
# Development
# ─────────────────────────────────────────────
.env:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "⚠️  Created .env from .env.example — please review before running"; \
	fi

secrets/jwt_private.pem:
	@make gen-keys

gen-keys:
	@mkdir -p secrets
	@openssl genrsa -out secrets/jwt_private.pem 2048
	@openssl rsa -in secrets/jwt_private.pem -pubout -out secrets/jwt_public.pem
	@echo "✅ JWT RS256 keys generated in secrets/"

proto:
	@which protoc > /dev/null || (echo "❌ Install protoc first" && exit 1)
	protoc --go_out=. --go-grpc_out=. proto/**/*.proto
	@echo "✅ Proto stubs generated"

frontend:
	cd apps/mobile && npm run dev

web:
	cd apps/web && npm run dev

install:
	npm install --legacy-peer-deps

# ─────────────────────────────────────────────
# Testing
# ─────────────────────────────────────────────
test:
	@for dir in services/*/; do \
		if [ -f "$$dir/go.mod" ]; then \
			echo "Testing $$dir..."; \
			cd $$dir && go test ./... -race -timeout 60s && cd ../..; \
		fi \
	done

test-api:
	@echo "Running API integration tests..."
	$(COMPOSE) exec api-gateway go test ./tests/integration/... -v -timeout 120s

earthquake:
	@echo "🌋 Firing mock earthquake alert (M6.2, 駿河湾)..."
	curl -X POST http://localhost:9999/fire \
		-H "Content-Type: application/json" \
		-d '{"magnitude":6.2,"epicenter":"駿河湾","depth":40,"intensity":"5強","tsunami":false}'
	@echo "✅ Check EarthquakeAlert.tsx in the app"

match-trigger:
	@echo "🚛 Creating mock match proposal..."
	curl -X POST http://localhost:8443/api/v1/debug/trigger-match \
		-H "Content-Type: application/json" \
		-H "Authorization: Bearer $$(cat /tmp/dev-token)" \
		-d '{"from":"大阪市中央区","to":"東京都港区","cargo":"精密機器","weight_kg":3500}'
