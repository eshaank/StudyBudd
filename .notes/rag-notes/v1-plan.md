## 1. Single source of truth: one document, two roles

- **`documents`** (existing) = “user uploaded this file.”  
  Stays as-is: `user_id`, `filename`, `storage_path`, `file_type`, etc.

- **`processing_documents`** = “RAG state for this document.”  
  Treat it as **RAG metadata for an upload**, not a separate “document.”

**Ideal data model:**

- Add a **foreign key** from `processing_documents` to `documents` (e.g. `processing_documents.source_document_id → documents.id`), **or**
- Use **the same ID**: when you create a row in `documents` for an upload, use that same UUID as `processing_documents.id`.  
  Then “this document” is one id everywhere: upload, storage, and RAG.

**Recommendation:** Same ID. When a user uploads a file you create one `documents` row with `id = uuid`; you use that same `id` for `processing_documents`. No extra FK column; one id for list/get/delete and for RAG status/chunks/query.

---

## 2. API surface: minimal and obvious

**Upload + process (main path for “RAG on the spot”):**

- **`POST /api/documents/upload`** (or keep current upload URL)  
  - Accepts: file (multipart), optional title.  
  - If file is **text or CSV**:  
    - Create `documents` row (and upload to storage) as today.  
    - **Then** run the RAG pipeline for that document id (extract text → chunk → embed → write to `processing_documents` + `document_chunks`).  
  - Response: document metadata **and** processing status (e.g. `processing_status: "ready"`, `chunks_count: N`), or 202 + status URL if you ever make it async.  
  - If file is PDF/image: create `documents` row only; `processing_status: "unsupported"` or `"pending"` until you add that path.

So the “ideal” interface for your current goal is: **one upload call that, for text/CSV, runs RAG synchronously and returns when the doc is queryable.**

**Optional (for re-processing or manual trigger):**

- **`POST /api/processing/{document_id}/process`**  
  - Body: empty (or overrides like title).  
  - Loads the document from `documents` by `document_id`, extracts text (text/CSV only), runs the same pipeline, updates `processing_documents` and chunks.  
  - Use when you want “re-run RAG for this upload” without re-uploading.

**Query (already in place):**

- **`POST /api/processing/rag/query`**  
  - Body: `document_id`, `question`, optional `top_k`.  
  - `document_id` = upload id = processing document id.  
  - No change needed if you adopt the “same id” approach.

**Status/chunks (already in place):**

- **`GET /api/processing/{document_id}/status`**  
- **`GET /api/processing/{document_id}/chunks`**  
  - Same `document_id` as the upload.

So the **ideal design** is: **one document id from upload through to RAG status, chunks, and query.**

---

## 3. Service layer: who does what

- **`documents`**  
  - **DocumentService**: upload, list, get, delete (and storage).  
  - **text_extraction**: `extract_text_from_document(document)` — stays here; it knows `documents` and storage.

- **`processing`**  
  - **ProcessingService** (expand this):  
    - `process_document(db, document_id, title, text)` (or `process_document(db, document_id)` that loads the document and gets text itself).  
    - Internally: ensure `processing_documents` row exists (id = document_id), clear old chunks, `chunk_text` → `embed` → write `document_chunks`, set status `ready`/`error`.  
  - Move **chunk_text** and **embed** (and optionally **generate_answer**) from the router into this service so the router only does HTTP and validation; the service is the single place for the RAG pipeline.

- **Orchestration**  
  - **Option A (simplest):** In the **documents** upload endpoint, after `DocumentService.upload()`: if `file_type in ("text", "csv")`, call `ProcessingService.process_document(db, document.id, ...)` with text from `extract_text_from_document(document)`.  
  - **Option B:** New endpoint e.g. `POST /api/documents/upload-and-process` that does upload then process in one handler and returns combined response.  
  - Both are “ideal” in different ways; A reuses existing upload URL; B keeps “upload and process” explicit. Prefer one so the frontend has a single flow: “upload (text/CSV) → get back document id + processing ready → query by that id.”

So the **ideal design** is: **ProcessingService owns the full RAG pipeline; documents layer only does upload + storage + text extraction and then calls ProcessingService when the file is text/CSV.**

---

## 4. Frontend flow (ideal)

1. User selects a text or CSV file and hits “Upload” (or “Upload and index”).  
2. **POST /api/documents/upload** (or upload-and-process).  
3. Response: `{ id, filename, processing_status: "ready", chunks_count: N }` (or 202 + polling link if async later).  
4. UI shows “Ready for questions” and a query box.  
5. User asks a question; frontend calls **POST /api/processing/rag/query** with `document_id: id` and `question`.  
6. Display answer and optional source chunks.

No separate “processing” step in the UI for the happy path; upload = index for text/CSV.

---

## 5. Edge cases and evolution

- **Empty or invalid text:** Pipeline should set `processing_documents.status = "error"` and optional `error` message; upload response can still return 200 with `processing_status: "error"` and `error` so the UI can show “Uploaded but indexing failed.”
- **Same ID for processing_documents:** On first process for a document, **insert** `processing_documents` with `id = document_id`; on re-process, **update** that row and replace chunks. No duplicate “document” concepts.
- **Later: async:** Add a job queue; upload creates `documents` row and enqueues “process document_id”; new endpoint `GET /api/processing/{document_id}/status` is already there for polling. ProcessingService is unchanged; only the trigger (sync vs enqueue) changes.
- **Later: PDFs:** When you add PDF extraction, the same pipeline (ProcessingService) runs; only the “extract text” step changes (documents or a small helper), and you might run it async for large PDFs.

---

## 6. Summary: ideal design in a few bullets

| Aspect | Ideal choice |
|--------|----------------|
| **Identity** | One id per upload; same id used for `documents` and `processing_documents`. |
| **Trigger** | For text/CSV: run RAG pipeline immediately in the upload flow (sync). |
| **Pipeline owner** | `ProcessingService` in `processing` (chunk → embed → store); router only delegates. |
| **Text source** | `extract_text_from_document(document)` from documents layer; processing receives text or document_id and fetches document when needed. |
| **API** | Upload endpoint that, for text/CSV, runs processing and returns document id + processing status; optional `POST /processing/{id}/process` for re-run; existing status/chunks/query unchanged. |
| **Frontend** | Single action: upload → then query by returned id; no separate “start processing” step for the default flow. |

That’s the ideal design: one document id, upload-triggered RAG for text/CSV, processing logic centralized in `ProcessingService`, and a simple “upload then query” interface.