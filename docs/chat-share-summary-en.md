# Chat and Share Feature Summary (English)

> Branch: `ac-share`  
> Goal: easy to read, easy to present, easy to trace to code

## 1) What Calls What (Call Chain)

### Share (Document Sharing) Call Chain

1. User clicks Share in the files page, enters emails, and creates sharing.
   Entry points: `apps/web/src/app/dashboard/files/page.js:206`, `apps/web/src/app/dashboard/files/page.js:258`
2. Frontend calls `POST /api/documents/{id}/share-links`.
   Code: `apps/web/src/app/dashboard/files/page.js:268`
3. Backend Router receives the request and validates document ownership.
   Code: `apps/api/app/documents/router.py:126`
4. Service generates `share_token`, writes into `document_shares`, then writes recipient emails into `document_share_recipients`.
   Code: `apps/api/app/documents/service.py:231`
5. Frontend receives `share_url` and `share_token`, then renders Share link and Share tag.
   Code: `apps/web/src/app/dashboard/files/page.js:288`, `apps/web/src/app/dashboard/files/page.js:1062`
6. Recipient opens `/shared/[token]` and calls `GET /api/documents/shared/{token}`.
   Code: `apps/web/src/app/shared/[token]/page.js:42`, `apps/api/app/documents/router.py:163`
7. Backend checks permissions by JWT email (`owner`, `recipient` allowlist, or public `link`).
   Code: `apps/api/app/documents/service.py:319`
8. On download, frontend calls `GET /api/documents/shared/{token}/download`; backend reads file bytes from Supabase Storage and returns the response.
   Code: `apps/api/app/documents/router.py:194`, `apps/api/app/core/supabase.py:85`

### Chat (Streaming Conversation) Call Chain

1. User sends a message from Chat page.
   Entry point: `apps/web/src/app/dashboard/chat/page.js:200`
2. Frontend calls `POST /api/chat/stream`.
   Code: `apps/web/src/app/dashboard/chat/page.js:225`
3. Backend Router receives streaming request in `chat_stream`.
   Code: `apps/api/app/chat/router.py:30`
4. Service processes streaming chat: create conversation if needed, save user message, build history, and stream agent output.
   Code: `apps/api/app/chat/service.py:147`
5. If RAG is needed, agent tool `search_my_documents` performs retrieval.
   Code: `apps/api/app/chat/agent.py:94`, `apps/api/app/chat/agent.py:115`
6. Backend returns SSE `token`/`done` events; frontend appends tokens in real time and finalizes message on done.
   Code: `apps/api/app/chat/service.py:205`, `apps/api/app/chat/service.py:239`, `apps/web/src/app/dashboard/chat/page.js:263`, `apps/web/src/app/dashboard/chat/page.js:276`

## 2) Where the Code Is

### Share

- Share table models: `apps/api/app/documents/models.py:142`, `apps/api/app/documents/models.py:168`
- Share request/response DTOs: `apps/api/app/documents/schemas.py:59`, `apps/api/app/documents/schemas.py:84`, `apps/api/app/documents/schemas.py:96`
- Share business logic: `apps/api/app/documents/service.py:195` to `apps/api/app/documents/service.py:358`
- Share routes: `apps/api/app/documents/router.py:126`, `apps/api/app/documents/router.py:163`, `apps/api/app/documents/router.py:194`
- Frontend share modal: `apps/web/src/app/dashboard/files/page.js:206`, `apps/web/src/app/dashboard/files/page.js:1020`
- Share landing page: `apps/web/src/app/shared/[token]/page.js:30`
- Share base URL config: `apps/api/app/core/config.py:163`
- Migration: `apps/api/alembic/versions/20260224_000001_add_document_shares_and_profile_policies.py:21`

### Chat

- Frontend chat page: `apps/web/src/app/dashboard/chat/page.js:48`, `apps/web/src/app/dashboard/chat/page.js:77`, `apps/web/src/app/dashboard/chat/page.js:200`
- Chat routes: `apps/api/app/chat/router.py:30`, `apps/api/app/chat/router.py:49`, `apps/api/app/chat/router.py:59`, `apps/api/app/chat/router.py:68`, `apps/api/app/chat/router.py:90`
- Chat service: `apps/api/app/chat/service.py:147`
- Agent/RAG tool: `apps/api/app/chat/agent.py:58`, `apps/api/app/chat/agent.py:94`

## 3) What Supabase Is Used For

### Share

- Supabase Auth JWT: parse `sub` and `email`.
  Code: `apps/api/app/core/dependencies.py:66`, `apps/api/app/core/dependencies.py:154`
- Supabase PostgreSQL: `document_shares` and `document_share_recipients` for sharing ACL relationship.
  Code: `apps/api/app/documents/models.py:142`, `apps/api/app/documents/models.py:168`
- Supabase Storage: shared file download.
  Code: `apps/api/app/core/supabase.py:85`

### Chat

- Supabase Auth JWT: endpoint authentication.
  Code: `apps/api/app/core/dependencies.py:66`
- Supabase PostgreSQL: `conversations` and `messages` for chat data.
  Code: `apps/api/app/chat/router.py:55`, `apps/api/app/chat/service.py:169`, `apps/api/app/chat/service.py:227`

## 4) What Code Features Were Used

### Share

- Secure token generation: `secrets.token_urlsafe(24)`.
  Code: `apps/api/app/documents/service.py:249`
- Email normalization and dedupe: `lower/strip + validation`.
  Code: `apps/api/app/documents/schemas.py:65`, `apps/api/app/documents/service.py:195`
- Recipient allowlist unique constraint: `(share_id, recipient_email)`.
  Code: `apps/api/app/documents/models.py:173`
- Access control levels: `owner / recipient / link`.
  Code: `apps/api/app/documents/service.py:319`
- Frontend supports both modes:
  `tag/link only` (no email) and `email-restricted sharing`.
  Code: `apps/web/src/app/dashboard/files/page.js:329`

### Chat

- SSE streaming response (`token` / `done`).
  Code: `apps/api/app/chat/service.py:205`, `apps/api/app/chat/service.py:239`
- Frontend token-by-token rendering and done-event finalize.
  Code: `apps/web/src/app/dashboard/chat/page.js:263`, `apps/web/src/app/dashboard/chat/page.js:276`
- Auto conversation creation and history assembly.
  Code: `apps/api/app/chat/service.py:161`, `apps/api/app/chat/service.py:181`
- Optional RAG tool retrieval and source propagation.
  Code: `apps/api/app/chat/agent.py:94`, `apps/api/app/chat/service.py:248`
