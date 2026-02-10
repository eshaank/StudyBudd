# Development Setup

This guide explains how to set up your local development environment for StudyBudd.

## Prerequisites

- Node.js 18+
- Python 3.12+
- A Supabase project (database, auth, storage)
- Docker (optional, for running services in containers)

## Environment Variables

Create a `.env` file in the **project root** (`/study-budd/.env`). Copy from `docs/env.example` and fill in your values.

### Required Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# Database (Supabase Postgres connection string)
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres

# Development Mode (enables auth bypass)
DEBUG=true
DEV_USER_ID=00000000-0000-0000-0000-000000000001
```

### Getting Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create one)
3. Go to **Project Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_KEY`
5. Go to **Project Settings** → **API** → **JWT Settings**
   - Copy **JWT Secret** → `SUPABASE_JWT_SECRET`
6. Go to **Project Settings** → **Database** → **Connection string**
   - Copy the URI (URI mode) → `DATABASE_URL`

---

## Running with Docker (Recommended for Dev)

**One command** – starts frontend and API in dev mode with hot reload:

```bash
# From project root
./docker-run.sh
# or
make dev
```

Requires `.env` in project root. Services:

- **Frontend:** http://localhost:3000
- **API:** http://localhost:8000

**View logs:**

```bash
make logs
# or
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f
```

---

## Running Locally (Without Docker)

**Terminal 1 – Backend:**

```bash
cd apps/api
uv run uvicorn app.main:app --reload --port 8000
```

**Terminal 2 – Frontend:**

```bash
cd apps/web
npm run dev
```

Frontend at `http://localhost:3000`, API at `http://localhost:8000`.

### Important: Environment File Location

Next.js reads `.env` from its own directory. Create a symlink:

```bash
ln -s ../../.env apps/web/.env
```

---

## Database Migrations

Migrations run against Supabase Postgres. From project root:

```bash
make db-migrate
# or
cd apps/api && uv run alembic upgrade head
```

---

## Troubleshooting

### "Missing NEXT_PUBLIC_SUPABASE_URL" Error

1. Ensure `.env` exists in `apps/web/` (symlink or copy from root)
2. Restart the Next.js dev server after changing env vars

### 401 Unauthorized on API Requests

In development:

1. Set `DEBUG=true` in `.env`
2. Set `DEV_USER_ID` to a valid UUID
3. Restart the backend

See [Authentication](./authentication.md) for dev mode bypass.

### Docker: "Cannot connect to API"

Ensure `.env` is in the project root. Docker Compose passes it via `env_file`.
