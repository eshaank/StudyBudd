# StudyBudd Documentation

This folder contains documentation for the StudyBudd application.

## Contents

- [Development Setup](./development-setup.md) - How to set up your local development environment
- [Authentication](./authentication.md) - How authentication works and dev mode bypass
- [Document Upload](./document-upload.md) - How the document upload feature works
- [Chat Streaming](./chat-streaming.md) - How streaming works from browser to Together AI
- [Document Sharing](./document-sharing.md) - Share links and access control flow
- [Document Sharing (ZH)](./document-sharing-implementation-zh.md) - Detailed Chinese implementation guide
- [Chat & Profile / Account Summary (ZH)](./chat-profile-account-summary-zh.md) - 中文版：Chat + Profile / Account 总结
- [Chat & Profile / Account Summary (EN)](./chat-profile-account-summary-en.md) - English version: Chat + Profile / Account summary
- [Account Avatar / Progress Storage Plan (ZH)](./account-avatar-progress-storage-plan-zh.md) - Account 页面头像与进度存储改造方案

## Quick Start

1. Copy the environment variables template to `.env` in the project root
2. Set `DEBUG=true` for development mode
3. Start the backend: `cd apps/api && uvicorn app.main:app --reload --port 8000`
4. Start the frontend: `cd apps/web && npm run dev`
5. Visit `http://localhost:3000`
