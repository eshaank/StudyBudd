# Documentation Structure

Proposed organization for StudyBudd docs. Backend grouping is already started; this completes the rest.

## Directory Layout

```
docs/
├── README.md                    # Index and quick start (links into subfolders)
├── env.example                  # Environment template (stays at root)
├── DOCS-STRUCTURE.md            # This file
│
├── overview/                    # System-wide and getting started
│   ├── system-overview-and-architecture.md
│   └── development-setup.md
│
├── backend/                     # API, services, and data layer
│   ├── api-onboarding.md        # Single map of API structure, auth, RAG, storage
│   ├── auth/
│   │   └── authentication.md
│   ├── chat/
│   │   ├── chat-streaming.md
│   │   ├── chat-profile-account-summary-en.md
│   │   └── chat-profile-account-summary-zh.md
│   ├── documents/
│   │   └── document-upload.md
│   ├── document_sharing/
│   │   ├── document-sharing.md
│   │   └── document-sharing-implementation-zh.md
│   └── processing/              # RAG pipeline (chunking, embeddings, pgvector)
│       ├── rag-setup.md
│       ├── rag-flow.md
│       └── rag-pipeline-diagram.md
│
├── frontend/                    # Next.js app, UI, and features
│   ├── architecture.md          # (from frontend-architecture.md)
│   ├── dashboard.md             # (from frontend-dashboard.md)
│   ├── overall-design.md        # (from frontend-overall-design.md)
│   ├── refactoring-plan.md      # (from frontend-refactoring-plan.md)
│   ├── pomodoro-flashcards-quizzes.md
│   └── account/
│       └── account-avatar-progress-storage-plan-zh.md
│
└── testing/
    └── playwright-testing-guide.md
```

## Rationale

| Area | Purpose |
|------|--------|
| **overview/** | Entry point: system picture and dev setup. No domain-specific detail. |
| **backend/** | One place for API, auth, chat, documents, sharing, and RAG. Matches `apps/api` modules (chat, documents, document_sharing, processing). |
| **frontend/** | All web app docs: architecture, dashboard, design, refactor plan, feature docs (pomodoro/flashcards/quizzes), account plans. |
| **testing/** | QA and E2E (Playwright). Can add unit/test strategy later. |

## Naming Conventions

- **Folders:** lowercase with underscores only where they mirror code (e.g. `document_sharing`).
- **Files:** `kebab-case.md`. Keep `-zh` / `-en` suffix for localized content in the same folder (e.g. `chat-profile-account-summary-zh.md` next to `...-en.md`).
- **Overview docs:** Keep names like `system-overview-and-architecture.md` and `development-setup.md`; move into `overview/` without renaming unless you prefer shorter names.

## Internal References to Update After Moving

If you move files, update these references:

1. **docs/backend/document_sharing/document-sharing-implementation-zh.md**  
   - “概览文档：`docs/document-sharing.md`” → `docs/backend/document_sharing/document-sharing.md`

2. **docs/api-onboarding.md** (→ `backend/api-onboarding.md`)  
   - “see `docs/rag-flow.md`, `docs/chat-streaming.md`, and `docs/document-upload.md`”  
   - → `docs/backend/processing/rag-flow.md`, `docs/backend/chat/chat-streaming.md`, `docs/backend/documents/document-upload.md`

3. **docs/rag-pipeline-diagram.md** (→ `backend/processing/rag-pipeline-diagram.md`)  
   - “Generated from `docs/rag-flow.md`” → `docs/backend/processing/rag-flow.md`

4. **docs/README.md**  
   - All links should point into the new paths (overview, backend, frontend, testing).

## Optional: Flatter Backend

If you prefer fewer backend subfolders:

- Keep `backend/chat/`, `backend/document_sharing/`, and `backend/documents/` as above.
- Put auth and processing at backend root: `backend/authentication.md`, `backend/rag-setup.md`, `backend/rag-flow.md`, `backend/rag-pipeline-diagram.md`, and move `api-onboarding.md` to `backend/api-onboarding.md`.

The structure above keeps backend grouped by feature (auth, chat, documents, document_sharing, processing), which scales better as you add more modules.
