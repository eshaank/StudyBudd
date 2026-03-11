# StudyBudd Justfile
# Install just: https://github.com/casey/just
# Usage: just <command>

# Show available commands
default:
    @just --list

# =============================================================================
# Docker Commands
# =============================================================================

# Start all services in dev mode with hot reload
dev:
    docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# Start all services in production mode (detached)
up:
    docker compose up -d

# Stop all services
down:
    docker compose -f docker-compose.yml -f docker-compose.dev.yml down

# Alias for down
stop: down

# Build all Docker images
build:
    docker compose build

# Follow logs from all services
logs:
    docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f

# Stop services and remove volumes
clean:
    docker compose down -v

# =============================================================================
# Individual Services
# =============================================================================

# Run frontend dev server locally (without Docker)
web:
    cd apps/web && npm run dev

# Run API dev server locally (without Docker)
api:
    cd apps/api && . .venv/bin/activate && uv run uvicorn app.main:app --reload

# =============================================================================
# Setup
# =============================================================================

# Install all dependencies
install:
    cd apps/web && npm install
    cd apps/api && uv sync

# Install all dependencies including dev extras
install-dev:
    cd apps/web && npm install
    cd apps/api && uv sync --all-extras

# =============================================================================
# Quality
# =============================================================================

# Run backend tests
test:
    cd apps/api && uv run pytest

# Lint backend
lint:
    cd apps/api && uv run ruff check

# Type check backend
typecheck:
    cd apps/api && uv run mypy app

# Lint frontend
lint-web:
    cd apps/web && npm run lint

# Build frontend (catches errors)
build-web:
    cd apps/web && npm run build
