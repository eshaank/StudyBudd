# StudyBudd Documentation

This folder contains documentation for the StudyBudd application. See [DOCS-STRUCTURE.md](./DOCS-STRUCTURE.md) for the current layout and conventions.

## Overview

- [System Overview & Architecture](./overview/system-overview-and-architecture.md) - Product and technical architecture
- [Development Setup](./overview/development-setup.md) - Local development environment

## Backend

- [API Onboarding](./backend/api-onboarding.md) - Backend structure, auth, RAG, and storage map
- [Authentication](./backend/auth/authentication.md) - Auth flow and dev bypass
- [Chat Streaming](./backend/chat/chat-streaming.md) - SSE streaming from browser to Together AI
- [Chat & Profile / Account Summary (EN)](./backend/chat/chat-profile-account-summary-en.md)
- [Chat & Profile / Account Summary (ZH)](./backend/chat/chat-profile-account-summary-zh.md)
- [Document Upload](./backend/documents/document-upload.md) - Upload and processing flow
- [Document Sharing](./backend/document_sharing/document-sharing.md) - Share links and access control overview
- [Document Sharing (ZH)](./backend/document_sharing/document-sharing-implementation-zh.md) - 中文版：Document Sharing 总结（当前分支状态 + 代码定位）
- [RAG Setup](./backend/processing/rag-setup.md) - Embeddings and pgvector

## Frontend

- [Frontend Architecture](./frontend/frontend-architecture.md)
- [Frontend Dashboard](./frontend/frontend-dashboard.md)
- [Frontend Overall Design](./frontend/frontend-overall-design.md)
- [Frontend Refactoring Plan](./frontend/frontend-refactoring-plan.md)
- [Frontend Pomodoro / Flashcards / Quizzes](./frontend/frontend-pomodoro-flashcards-quizzes.md)
- [Account Avatar / Progress Storage Plan (ZH)](./frontend/account/account-avatar-progress-storage-plan-zh.md)

## Testing

- [Playwright Testing Guide](./testing/playwright-testing-guide.md)

## Quick Start

1. Copy `env.example` to `.env` in the project root
2. Set `DEBUG=true` for development mode
3. Start the backend: `cd apps/api && uvicorn app.main:app --reload --port 8000`
4. Start the frontend: `cd apps/web && npm run dev`
5. Visit `http://localhost:3000`

For all run modes (Docker dev/prod, local, tests, lint) and troubleshooting, see the root **[RUNBOOK.md](../RUNBOOK.md)**.
