# RAG Pipeline Flow — StudyBudd

Presentation-ready Mermaid diagram of the RAG (Retrieval-Augmented Generation) pipeline.

---

## By phase (recommended for slides)

Grouped into **Extraction → Embedding → Lookup → Generation**. Clear phases, fits a slide.

```mermaid
flowchart LR
    subgraph Extraction["Extraction"]
        A[Upload] --> B[Text extract]
        B --> C[Chunk]
    end

    subgraph Embedding["Embedding"]
        C --> D[Embed chunks]
        D --> E[(pgvector)]
    end

    subgraph Lookup["Lookup"]
        F[Question] --> G[Embed query]
        G --> H[Similarity search]
        E --> H
        H --> I[Top-k chunks]
    end

    subgraph Generation["Generation"]
        I --> J[Context + question]
        J --> K[LLM]
        K --> L[Response]
    end
```

**Vertical layout (same phases, stacks better in a tall box):**

```mermaid
flowchart TB
    subgraph Extraction["1. Extraction"]
        A[Upload document] --> B[Extract text]
        B --> C[Chunk]
    end

    subgraph Embedding["2. Embedding"]
        C --> D[Embed chunks]
        D --> E[(Store in pgvector)]
    end

    subgraph Lookup["3. Lookup"]
        F[User question] --> G[Embed query]
        G --> H[Similarity search]
        E --> H
        H --> I[Top-k chunks]
    end

    subgraph Generation["4. Generation"]
        I --> J[Context + question → LLM]
        J --> K[Streamed response]
    end
```

---

## Full pipeline (Indexing + Query)

```mermaid
flowchart TB
    subgraph Indexing["📥 Indexing (on upload — TXT/CSV)"]
        direction TB
        A[("📄 Document\n(TXT / CSV)")]
        A --> B[Extract text]
        B --> C[Chunk text\n900 chars, 150 overlap]
        C --> D[Embed chunks\nTogether API · BAAI/bge or E5]
        D --> E[("🗄️ document_chunks\npgvector 768/1024-d")]
    end

    subgraph Query["❓ Query (Ask)"]
        direction TB
        Q[("👤 User question")]
        Q --> R[Embed question\nsame model]
        R --> S[Vector similarity search\ncosine distance ≤>]
        E -.-> S
        S --> T[Top-k chunks\ncontext]
        T --> U[Build context string]
        U --> V[LLM: question + context\nTogether API · Llama"]
        V --> W[("📝 Answer")]
    end

    style Indexing fill:#e8f4f8
    style Query fill:#f0f8e8
    style E fill:#d4edda
    style W fill:#d4edda
```

---

## Simplified (high-level)

```mermaid
flowchart LR
    subgraph Index["Index"]
        D1[Document] --> D2[Chunk]
        D2 --> D3[Embed]
        D3 --> D4[(pgvector)]
    end

    subgraph Ask["Ask"]
        Q1[Question] --> Q2[Embed]
        Q2 --> Q3[Similarity search]
        D4 --> Q3
        Q3 --> Q4[Top-k chunks]
        Q4 --> Q5[LLM + context]
        Q5 --> Q6[Answer]
    end

    style Index fill:#e3f2fd
    style Ask fill:#e8f5e9
```

---

## Sequence (who does what)

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant API as FastAPI
    participant DB as PostgreSQL + pgvector
    participant T as Together API

    Note over U,T: Indexing (upload)
    U->>F: Upload TXT/CSV
    F->>API: POST /documents/upload
    API->>DB: documents + processing_documents
    API->>API: Extract text → Chunk → Embed
    API->>T: POST /v1/embeddings (chunks)
    T-->>API: vectors
    API->>DB: INSERT document_chunks
    API-->>F: status: ready

    Note over U,T: Query (Ask)
    U->>F: Click Ask, submit question
    F->>API: POST /processing/rag/query
    API->>DB: Verify ownership, status=ready
    API->>T: POST /v1/embeddings (question)
    T-->>API: question vector
    API->>DB: SELECT ... ORDER BY embedding <=> q LIMIT k
    DB-->>API: top-k chunks
    API->>T: POST /v1/chat/completions (question + context)
    T-->>API: answer
    API-->>F: answer + context_chunks
    F-->>U: Show answer + sources
```

---

## Data flow (tables)

```mermaid
flowchart LR
    subgraph Storage["Supabase Storage"]
        F[("File bytes")]
    end

    subgraph PG["PostgreSQL (Supabase)"]
        DOC[("documents\nmetadata, storage_path")]
        PROC[("processing_documents\nstatus, title")]
        CHUNKS[("document_chunks\ncontent, embedding")]
        DOC --> PROC
        PROC --> CHUNKS
    end

    F -.-> DOC
    CHUNKS -->|cosine ≤>| Q[Question embedding]
```

---

*Generated from `docs/rag-flow.md` and `apps/api/app/processing/service.py`.*
