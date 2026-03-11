# StudyBudd Runbook

Installation guide, run modes, and troubleshooting for new and returning contributors.

---

## Prerequisites


| Tool                                          | Version | Notes                                                          |
| --------------------------------------------- | ------- | -------------------------------------------------------------- |
| [Node.js](https://nodejs.org/)                | 18+     | Required for frontend                                          |
| [Python](https://www.python.org/)             | 3.12+   | Required for backend                                           |
| [UV](https://docs.astral.sh/uv/)              | latest  | Python package manager (`pip install uv` or `brew install uv`) |
| [just](https://github.com/casey/just)         | latest  | Task runner (`brew install just` on macOS)                     |
| [Docker](https://docs.docker.com/get-docker/) | 24+     | Required for Docker run modes                                  |
| Supabase project                              | —       | Hosted DB, auth, and storage. Free tier works.                 |
| Together AI account                           | —       | For LLM / AI features (`TOGETHER_API_KEY`)                     |


Docker is **optional** if you run services locally. `just` is optional (you can run the raw commands directly).

---

## One-Time Setup

### 1. Clone the repository

```bash
gh repo clone eshaank/StudyBudd
cd StudyBudd
```

### 2. Configure environment variables

```bash
cp docs/env.example .env
```

Open `.env` and fill in your credentials. The file is self-documented with comments. At minimum you need:


| Variable                        | Where to get it                                                            |
| ------------------------------- | -------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase Dashboard → Project Settings → API → Project URL                  |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Project Settings → API → anon/public key              |
| `SUPABASE_URL`                  | Same as `NEXT_PUBLIC_SUPABASE_URL`                                         |
| `SUPABASE_SERVICE_KEY`          | Supabase Dashboard → Project Settings → API → service_role key             |
| `SUPABASE_JWT_SECRET`           | Supabase Dashboard → Project Settings → API → JWT Settings → JWT Secret    |
| `DATABASE_URL`                  | Supabase Dashboard → Project Settings → Database → Connection string (URI) |
| `TOGETHER_API_KEY`              | [api.together.ai](https://api.together.ai) → API Keys                      |


See [docs/env.example](docs/env.example) for all variables (storage bucket, upload limits, app URLs, etc.).

### 3. Install dependencies (local dev only)

```bash
just install
```

This runs `npm install` in `apps/web` and `uv sync` in `apps/api`. Skip this step if you're running with Docker only.

---

## Ways to Run

### Option A — Docker (recommended for development)

Starts both frontend and API with hot reload. Requires `.env` in the project root.

```bash
./docker-run.sh
# or
just dev
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:8000](http://localhost:8000)

`docker-run.sh` checks that ports 3000 and 8000 are free and handles Ctrl+C gracefully. `just dev` runs the same Docker Compose command directly.

View logs in another terminal:

```bash
just logs
```

Stop containers (Ctrl+C in the `docker-run.sh` terminal, or):

```bash
just down
```

---

### Option B — Docker (production / detached)

```bash
just up       # start all services in the background
just logs     # tail logs
just down     # stop all services
just clean    # stop and remove volumes
```

---

### Option C — Local (without Docker)

Run frontend and backend in separate terminals. No Docker required.

**Terminal 1 — Backend:**

```bash
just api
# equivalent: cd apps/api && uv run uvicorn app.main:app --reload
```

API available at [http://localhost:8000](http://localhost:8000).

**Terminal 2 — Frontend:**

```bash
just web
# equivalent: cd apps/web && npm run dev
```

Frontend available at [http://localhost:3000](http://localhost:3000).

> **Note:** Next.js reads `.env` from its own directory. Create a symlink so the root `.env` is used:
>
> ```bash
> # From the StudyBudd directory run
> ln -s ../../.env apps/web/.env
> ```
>
> Restart the Next.js server after any `.env` changes.

---

### Option D — Tests

**Backend (pytest):**

```bash
just test
# equivalent: cd apps/api && uv run pytest
```

**Frontend (Jest):**

```bash
cd apps/web && npm run test
```

**End-to-end (Playwright):**

```bash
# from project root
npx playwright test
```

Playwright config is at [playwright.config.js](playwright.config.js). Tests live in [tests/](tests/).

---

### Option E — Linting & Type Checking

```bash
just lint          # ruff (backend)
just lint-web      # eslint (frontend)
just typecheck     # mypy (backend)
just build-web     # next build — catches frontend type/compile errors
```

---

## All Commands Reference

Run `just` (with no arguments) to list all available commands.


| Command            | Description                                      |
| ------------------ | ------------------------------------------------ |
| `just dev`         | Start all services in dev mode (hot reload)      |
| `just up`          | Start all services in production mode (detached) |
| `just down`        | Stop all services                                |
| `just stop`        | Alias for `just down`                            |
| `just build`       | Build all Docker images                          |
| `just logs`        | Follow logs from all services                    |
| `just clean`       | Stop and remove volumes                          |
| `just web`         | Run frontend locally                             |
| `just api`         | Run API locally                                  |
| `just install`     | Install frontend and backend dependencies        |
| `just install-dev` | Install dependencies including dev extras        |
| `just test`        | Run backend tests                                |
| `just lint`        | Lint backend (ruff)                              |
| `just lint-web`    | Lint frontend (eslint)                           |
| `just typecheck`   | Type-check backend (mypy)                        |
| `just build-web`   | Build frontend                                   |


---

## Troubleshooting

### `.env` file not found

```
Error: .env file not found in project root.
Copy docs/env.example to .env and fill in your Supabase credentials.
```

Run `cp docs/env.example .env` and fill in the required values (see One-Time Setup above).

### Port already in use

```
Error: Port 3000 is already in use.
```

Find and stop the process:

```bash
lsof -ti :3000 | xargs kill   # or use :8000
```

Then re-run.

### Missing `NEXT_PUBLIC_SUPABASE_URL` error (local dev)

1. Ensure `.env` exists in `apps/web/` — create a symlink: `ln -s ../../.env apps/web/.env`
2. Restart the Next.js dev server after changing env vars.

### 401 Unauthorized on API requests (local dev)

For development bypass:

1. Set `DEBUG=true` in `.env`
2. Set `DEV_USER_ID` to a valid UUID (e.g. `00000000-0000-0000-0000-000000000001`)
3. Restart the backend

See [docs/backend/auth/authentication.md](docs/backend/auth/authentication.md) for the full auth flow.

### Docker: "Cannot connect to API"

Ensure `.env` is in the project root. Docker Compose passes it via `env_file`.

---

## Further Reading


| Document                                                                                               | Description                      |
| ------------------------------------------------------------------------------------------------------ | -------------------------------- |
| [docs/README.md](docs/README.md)                                                                       | Full documentation index         |
| [docs/overview/development-setup.md](docs/overview/development-setup.md)                               | Detailed dev environment guide   |
| [docs/overview/system-overview-and-architecture.md](docs/overview/system-overview-and-architecture.md) | System architecture overview     |
| [docs/backend/api-onboarding.md](docs/backend/api-onboarding.md)                                       | Backend API structure, auth, RAG |
| [docs/backend/auth/authentication.md](docs/backend/auth/authentication.md)                             | Auth flow and dev bypass         |
| [docs/testing/playwright-testing-guide.md](docs/testing/playwright-testing-guide.md)                   | E2E testing guide                |


