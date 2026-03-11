# StudyBudd API

FastAPI backend for the StudyBudd application.

## File Structure
apps/api/app/
├── main.py                      # Entry point
├── core/                        # Shared infrastructure
│   ├── config.py                # Settings
│   ├── database.py              # DB engine & session
│   ├── dependencies.py          # Auth (CurrentUser) + DB (DbSession)
│   └── supabase.py              # Storage client & helpers
│
├── documents/                   # Document feature module
│   ├── router.py                # /api/documents endpoints
│   ├── schemas.py               # Request/response DTOs
│   ├── models.py                # Document entity + Base
│   └── service.py               # DocumentService class
│
├── processing/                  # RAG pipeline (stubs)
│   ├── router.py
│   ├── schemas.py
│   ├── models.py
│   └── service.py
│
├── chat/                        # Chat feature (stubs)
│   ├── router.py
│   ├── schemas.py
│   ├── models.py
│   └── service.py
│
└── inference/                   # LLM integration (stubs)
    ├── client.py
    └── prompts.py


## Tech Stack

- **Python 3.12**
- **FastAPI** - Web framework
- **Pydantic / PydanticAI** - Data validation and AI agents
- **SQLAlchemy** - ORM
- **PostgreSQL + pgvector** - Database with vector embeddings
- **UV** - Package manager

Schema is managed manually (e.g. via Supabase SQL Editor or dashboard); there are no migration scripts in this repo.

## Development Setup

### Prerequisites

- Python 3.12+
- [UV](https://docs.astral.sh/uv/) package manager
- PostgreSQL with pgvector extension

### Installation

```bash
# Install dependencies
uv sync

# Run development server
uv run uvicorn app.main:app --reload
```

## API Documentation

Once running, access the API docs at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
