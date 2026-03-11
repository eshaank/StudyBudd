# StudyBudd — System Overview & Architecture

Presentation-ready Mermaid diagrams: **system overview** (what the product is and how users interact with it) and **architecture** (technical components and data flow).

---

## 1. System Overview

High-level view: who uses the app, main features, and external services.

```mermaid
flowchart TB
    subgraph User["👤 User"]
        Student[Student]
    end

    subgraph StudyBudd["StudyBudd"]
        direction TB
        Chat[💬 Chat with AI]
        Files[📁 Files & Ask]
        Cards[🃏 Flashcards]
        Quiz[📝 Quizzes]
        Share[🔗 Share links]
        Pomodoro[⏱ Pomodoro]
    end

    subgraph External["External Services"]
        Supabase[Supabase\nAuth · DB · Storage]
        Together[Together AI\nLLM · Embeddings]
    end

    Student --> Chat & Files & Cards & Quiz & Share & Pomodoro
    Chat --> Together
    Files --> Supabase
    Files --> Together
    Chat --> Supabase
    Cards --> Supabase
    Quiz --> Supabase
    Share --> Supabase
```

**In one sentence:** Students use StudyBudd (Chat, Files, Flashcards, Quizzes, Sharing, Pomodoro) with auth and data in Supabase and AI from Together.

---

## 2. Architecture

Technical layers: frontend, backend, data, and external APIs.

```mermaid
%%{init: {
  "theme": "base",
  "themeVariables": {
    "primaryColor": "#1e293b",
    "primaryTextColor": "#f1f5f9",
    "primaryBorderColor": "#334155",
    "lineColor": "#64748b",
    "secondaryColor": "#0f172a",
    "tertiaryColor": "#0f172a",
    "background": "#0f172a",
    "mainBkg": "#1e293b",
    "nodeBorder": "#334155",
    "clusterBkg": "#0f172a",
    "clusterBorder": "#334155",
    "titleColor": "#94a3b8",
    "edgeLabelBackground": "#1e293b",
    "fontFamily": "ui-monospace, monospace",
    "fontSize": "13px"
  }
}}%%
flowchart TB
    subgraph Frontend["FRONTEND — Next.js 15"]
        MW["Middleware\nprotect /dashboard"]
        Pages["Dashboard\nChat · Files · Flashcards · Quizzes"]
        Auth["Login / Signup"]
        Client["api.js + Bearer JWT"]
        MW --> Pages
        Pages --> Client
        Auth --> Client
    end

    subgraph Backend["BACKEND — FastAPI"]
        API["/api/documents  /chat\n/processing  /folders\n/flashcards  /quizzes"]
        Deps["Auth + DB Session"]
        API --> Deps
    end

    subgraph Data["DATA — Supabase"]
        PG[("PostgreSQL\n+ pgvector")]
        Store[("Storage")]
    end

    subgraph AI["AI — Together AI"]
        Embed["Embeddings"]
        LLM["Chat / LLM"]
    end

    Client --> API
    Deps --> PG
    Deps --> Store
    API --> Embed
    API --> LLM

    classDef default fill:#1e293b,stroke:#334155,color:#e2e8f0,rx:6
    classDef db fill:#172033,stroke:#2d4a7a,color:#93c5fd
    classDef ai fill:#1a1a2e,stroke:#4c1d95,color:#c4b5fd
    classDef client fill:#1e2a1e,stroke:#166534,color:#86efac

    class PG,Store db
    class Embed,LLM ai
    class Client client

    style Frontend fill:#0f172a,stroke:#1e40af,color:#93c5fd
    style Backend fill:#0f172a,stroke:#047857,color:#6ee7b7
    style Data   fill:#0f172a,stroke:#1d4ed8,color:#93c5fd
    style AI     fill:#0f172a,stroke:#6d28d9,color:#c4b5fd
```

**Summary:** Next.js calls FastAPI with JWT; FastAPI uses Supabase (PostgreSQL + pgvector + Storage) and Together AI (embeddings + chat). RAG is in `/api/processing`; Chat can call `search_my_documents` for document context.
