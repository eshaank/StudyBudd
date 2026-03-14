# StudyBudd

A full-stack study application with AI-powered features including document chat, flashcards, quizzes, and a Pomodoro timer.
Made as a group project for CSE 115A Software Engineering 1 @ UCSC
## Tech Stack


| Layer            | Technology                             |
| ---------------- | -------------------------------------- |
| Frontend         | Next.js 15, React 19, Tailwind CSS     |
| Backend          | FastAPI, Pydantic, PydanticAI          |
| Database         | Supabase (PostgreSQL + Auth + Storage) |
| AI / LLM         | Together AI                            |
| Package Managers | npm (frontend), UV (backend)           |
| Containerization | Docker, Docker Compose                 |
| Task Runner      | justfile                               |


## Project Structure

```
StudyBudd/
├── apps/
│   ├── web/                    # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/            # Next.js App Router pages & components
│   │   │   ├── features/       # Feature modules (quiz, etc.)
│   │   │   ├── lib/            # Shared utilities (Supabase client, API helpers)
│   │   │   └── __tests__/      # Frontend unit tests (Jest)
│   │   ├── public/
│   │   ├── package.json
│   │   └── Dockerfile
│   │
│   └── api/                    # FastAPI backend
│       ├── app/
│       │   ├── chat/           # Chat & AI messaging
│       │   ├── documents/      # Document upload & management
│       │   ├── flashcards/     # Flashcard generation & review
│       │   ├── folders/        # Folder organization
│       │   ├── inference/      # LLM client (Together AI)
│       │   ├── processing/     # RAG pipeline (chunking, embeddings, pgvector)
│       │   ├── quizzes/        # Quiz generation & tracking
│       │   └── core/           # Config, database, dependencies
│       ├── tests/              # Backend tests (pytest)
│       ├── pyproject.toml
│       └── Dockerfile
│
├── docs/                       # Project documentation
│   ├── env.example             # Environment variable template
│   ├── overview/               # Architecture & dev setup
│   ├── backend/                # API, auth, chat, RAG docs
│   ├── frontend/               # Frontend architecture & features
│   └── testing/                # Playwright & QA guides
│
├── docker/                     # Docker helper files (e.g. postgres/init.sql)
├── tests/                      # End-to-end tests (Playwright)
├── docker-compose.yml
├── docker-compose.dev.yml
├── docker-run.sh               # Convenience script for dev mode
├── justfile                    # Task runner commands (run: just <command>)
├── package.json                # Root package (Playwright dev dependency)
├── playwright.config.js
└── README.md
```

## Quick Start

```bash
# 1. Clone the repo
gh repo clone eshaank/StudyBudd && cd StudyBudd

# 2. Set up environment variables
cp docs/env.example .env
# Edit .env and fill in your Supabase and Together AI credentials

# 3. Install dependencies (You will need to have justfile installed)
just install

# 4. Run
./docker-run.sh   # Docker dev mode (recommended)
# — or — see RUNBOOK.md for all ways to run
```

See **[RUNBOOK.md](RUNBOOK.md)** for full installation instructions, all run modes (Docker, local, tests), and troubleshooting.

## Environment Setup

Copy the template and fill in your credentials:

```bash
cp docs/env.example .env
```

[docs/env.example](docs/env.example) contains all required variables with descriptions:

- **Supabase**: project URL, anon key, service role key, JWT secret, storage bucket, database URL
- **Together AI**: `TOGETHER_API_KEY`
- **App settings**: `NEXT_PUBLIC_API_URL`, `WEB_BASE_URL`, `SECRET_KEY`, `DEBUG`, upload limits

Supabase credentials are available at [supabase.com/dashboard](https://supabase.com/dashboard) under **Project Settings → API** and **Project Settings → Database**.

## Available Commands

Install [just](https://github.com/casey/just) (`brew install just` on macOS), then run `just` to list all commands:


| Command            | Description                                         |
| ------------------ | --------------------------------------------------- |
| `just dev`         | Start all services in development mode (hot reload) |
| `just build`       | Build all Docker images                             |
| `just up`          | Start all services in production mode (detached)    |
| `just down`        | Stop all services                                   |
| `just logs`        | Follow logs from all services                       |
| `just clean`       | Stop services and remove volumes                    |
| `just web`         | Run frontend locally (without Docker)               |
| `just api`         | Run API locally (without Docker)                    |
| `just install`     | Install all dependencies (frontend + backend)       |
| `just install-dev` | Install all dependencies including dev extras       |
| `just test`        | Run backend tests (pytest)                          |
| `just lint`        | Lint backend (ruff)                                 |
| `just lint-web`    | Lint frontend (eslint)                              |
| `just typecheck`   | Type-check backend (mypy)                           |
| `just build-web`   | Build frontend (catches errors)                     |


`./docker-run.sh` is an alternative to `just dev` that also checks port availability and handles Ctrl+C gracefully.


## API Documentation

Once the API is running, interactive docs are available at:

- **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

## Services


| Service  | URL                                            | Description             |
| -------- | ---------------------------------------------- | ----------------------- |
| Frontend | [http://localhost:3000](http://localhost:3000) | Next.js web application |
| API      | [http://localhost:8000](http://localhost:8000) | FastAPI backend         |


## Documentation


| Document                                                                                               | Description                                           |
| ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| [RUNBOOK.md](RUNBOOK.md)                                                                               | Installation, all ways to run, troubleshooting        |
| [docs/README.md](docs/README.md)                                                                       | Full documentation index (backend, frontend, testing) |
| [docs/overview/development-setup.md](docs/overview/development-setup.md)                               | Detailed local dev setup guide                        |
| [docs/overview/system-overview-and-architecture.md](docs/overview/system-overview-and-architecture.md) | System architecture                                   |
| [docs/backend/api-onboarding.md](docs/backend/api-onboarding.md)                                       | Backend API structure and RAG pipeline                |


## License

MIT
