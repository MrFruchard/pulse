.PHONY: dev down logs test-backend test-frontend lint-backend lint-frontend migrate

# Dev
dev:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f

# Tests
test-backend:
	cd backend && go test ./... -v -cover -race

test-frontend:
	cd frontend && npm test

test: test-backend test-frontend

# Lint
lint-backend:
	cd backend && golangci-lint run ./...

lint-frontend:
	cd frontend && npm run lint

lint: lint-backend lint-frontend

# Build local
build-backend:
	cd backend && go build -o bin/server ./cmd/server

# Migration
migrate:
	docker compose exec database psql -U $${POSTGRES_USER} -d $${POSTGRES_DB} -f /docker-entrypoint-initdb.d/001_init_schema.sql

# Go tidy
tidy:
	cd backend && go mod tidy
