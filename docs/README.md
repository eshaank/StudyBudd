# StudyBudd Documentation

This folder contains documentation for the StudyBudd application.

## Contents

- [Development Setup](./development-setup.md) - How to set up your local development environment
- [Authentication](./authentication.md) - How authentication works and dev mode bypass
- [Document Upload](./document-upload.md) - How the document upload feature works
- [Chat Streaming](./chat-streaming.md) - How streaming works from browser to Together AI
- [Document Sharing](./document-sharing.md) - Share links and access control flow
- [Document Sharing (ZH)](./document-sharing-implementation-zh.md) - Detailed Chinese implementation guide

## Quick Start

1. Copy the environment variables template to `.env` in the project root
2. Set `DEBUG=true` for development mode
3. Start the backend: `cd apps/api && uvicorn app.main:app --reload --port 8000`
4. Start the frontend: `cd apps/web && npm run dev`
5. Visit `http://localhost:3000`
