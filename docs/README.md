# StudyBudd Documentation

This folder contains documentation for the StudyBudd application. See [DOCS-STRUCTURE.md](./DOCS-STRUCTURE.md) for the full layout and conventions.

## Overview

- [System Overview & Architecture](./overview/system-overview-and-architecture.md) — Product and technical architecture (Mermaid diagrams)
- [Development Setup](./overview/development-setup.md) — Local development environment

## Backend

- [API Onboarding](./backend/api-onboarding.md) — Map of API structure, auth, RAG, storage
- [Authentication](./backend/auth/authentication.md) — Auth flow and dev bypass
- [Chat Streaming](./backend/chat/chat-streaming.md) — SSE streaming from browser to Together AI
- [Chat & Profile / Account Summary (EN)](./backend/chat/chat-profile-account-summary-en.md) | [(ZH)](./backend/chat/chat-profile-account-summary-zh.md)
- [Document Upload](./backend/documents/document-upload.md) — Upload and processing flow
- [Document Sharing](./backend/document_sharing/document-sharing.md) — Share links and access control
- [Document Sharing Implementation (ZH)](./backend/document_sharing/document-sharing-implementation-zh.md)
- [RAG Setup](./backend/processing/rag-setup.md) — Embeddings and pgvector
- [RAG Flow](./backend/processing/rag-flow.md) — Pipeline and retrieval
- [RAG Pipeline Diagram](./backend/processing/rag-pipeline-diagram.md)

## Frontend

- [Architecture](./frontend/frontend-architecture.md)
- [Dashboard](./frontend/frontend-dashboard.md)
- [Overall Design](./frontend/frontend-overall-design.md)
- [Refactoring Plan](./frontend/frontend-refactoring-plan.md)
- [Pomodoro, Flashcards, Quizzes](./frontend/frontend-pomodoro-flashcards-quizzes.md)
- [Account Avatar / Progress Storage Plan (ZH)](./frontend/account/account-avatar-progress-storage-plan-zh.md)

## Testing

- [Playwright Testing Guide](./testing/playwright-testing-guide.md)

## Quick Start

1. Copy `env.example` to `.env` in the project root
2. Set `DEBUG=true` for development mode
3. Start the backend: `cd apps/api && uvicorn app.main:app --reload --port 8000`
4. Start the frontend: `cd apps/web && npm run dev`
5. Visit http://localhost:3000
