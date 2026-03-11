# StudyBudd

A full-stack study application with AI-powered features.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, Tailwind CSS |
| Backend | FastAPI, Pydantic, PydanticAI |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| Package Managers | npm (frontend), UV (backend) |
| Containerization | Docker, Docker Compose |

## Project Structure

```
study-budd/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── src/
│   │   ├── public/
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   └── api/                    # FastAPI backend
│       ├── app/
│       │   ├── routers/
│       │   ├── models/
│       │   ├── schemas/
│       │   ├── services/
│       │   └── core/
│       ├── tests/
│       ├── pyproject.toml
│       └── Dockerfile
│
├── packages/                   # Shared code (optional)
├── docker-compose.yml
├── docker-compose.dev.yml
├── Makefile
└── README.md
```

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local frontend development)
- Python 3.12+ and [UV](https://docs.astral.sh/uv/) (for local backend development)

### Environment Setup

Create a `.env` file in the root directory:

```bash
# Application
DEBUG=false

# Security
SECRET_KEY=your-secret-key-change-in-production

# Supabase (copy from docs/env.example)
# NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_JWT_SECRET, etc.
# DATABASE_URL - Supabase Postgres connection string

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# AI/LLM Configuration (for PydanticAI)
# OPENAI_API_KEY=your-openai-api-key
# ANTHROPIC_API_KEY=your-anthropic-api-key
```

### Running with Docker

**Development mode (requires `.env` in project root):**

```bash
./docker-run.sh
# or
make dev
```

**Production mode (detached):**

```bash
make up
# or
docker compose up -d
```

**Stop all services:**

```bash
make down
# or
docker compose down
```

### Running Locally (without Docker)

**Frontend:**

```bash
cd apps/web
npm install
npm run dev
```

**Backend:**

```bash
cd apps/api
uv sync
uv run uvicorn app.main:app --reload
```

**Database:** Supabase (hosted). No local setup required. Set `DATABASE_URL` in `.env`.

## Available Commands

Run `make help` to see all available commands:

| Command | Description |
|---------|-------------|
| `make dev` | Start all services in development mode |
| `make build` | Build all Docker images |
| `make up` | Start all services (production, detached) |
| `make down` | Stop all services |
| `make logs` | Follow logs from all services |
| `make clean` | Stop services and remove volumes |
| `make web-dev` | Run frontend locally |
| `make api-dev` | Run API locally |
| `make install` | Install all dependencies |

## API Documentation

Once the API is running, access the documentation at:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## Services

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | Next.js web application |
| API | http://localhost:8000 | FastAPI backend |

## License

MIT
