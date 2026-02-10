.PHONY: help dev build up down stop logs clean web-dev api-dev db-migrate db-revision install

# Colors
CYAN := \033[36m
RESET := \033[0m

help: ## Show this help message
	@echo "$(CYAN)StudyBudd Monorepo Commands$(RESET)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "$(CYAN)%-15s$(RESET) %s\n", $$1, $$2}'

# =============================================================================
# Docker Commands
# =============================================================================

dev: ## Start all services in development mode with hot reload
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

build: ## Build all Docker images
	docker compose build

up: ## Start all services in production mode (detached)
	docker compose up -d

down: ## Stop all services
	docker compose -f docker-compose.yml -f docker-compose.dev.yml down

stop: ## Alias for down
	docker compose -f docker-compose.yml -f docker-compose.dev.yml down

logs: ## Follow logs from all services
	docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

clean: ## Stop services and remove volumes
	docker compose down -v

# =============================================================================
# Individual Services
# =============================================================================

web-dev: ## Run frontend dev server locally (without Docker)
	cd apps/web && npm run dev

api-dev: ## Run API dev server locally (without Docker)
	cd apps/api && uv run uvicorn app.main:app --reload

# =============================================================================
# Database (Supabase - migrations run against Supabase Postgres)
# =============================================================================

db-migrate: ## Run database migrations
	cd apps/api && uv run alembic upgrade head

db-revision: ## Create a new migration (usage: make db-revision msg="description")
	cd apps/api && uv run alembic revision --autogenerate -m "$(msg)"

# =============================================================================
# Setup
# =============================================================================

install: ## Install all dependencies
	cd apps/web && npm install
	cd apps/api && uv sync

install-dev: ## Install all dependencies including dev dependencies
	cd apps/web && npm install
	cd apps/api && uv sync --all-extras
