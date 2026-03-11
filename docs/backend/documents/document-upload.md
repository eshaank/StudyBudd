# Document Upload

This document explains how the document upload feature works in StudyBudd.

## Overview

Users can upload study materials (PDFs, images) which are:
1. Stored in Supabase Storage
2. Metadata saved in PostgreSQL
3. Later processed for AI-powered study features

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│   FastAPI   │────▶│  Supabase   │────▶│  PostgreSQL │
│  (Upload)   │     │   Backend   │     │   Storage   │     │  (Metadata) │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

## Frontend Components

### DocumentUpload Component

Location: `apps/web/src/app/components/DocumentUpload.jsx`

A drag-and-drop file upload component using `react-dropzone`.

**Features:**
- Drag and drop or click to browse
- Supports PDF, PNG, JPEG files
- 10MB max file size
- Progress indicator during upload
- Error handling with user-friendly messages

**Usage:**
```jsx
import DocumentUpload from "../components/DocumentUpload";

function MyPage() {
  const handleSuccess = (results) => {
    console.log("Uploaded documents:", results);
  };

  return <DocumentUpload onUploadSuccess={handleSuccess} />;
}
```

**Props:**
- `onUploadSuccess(results)` - Callback when upload completes. Receives array of upload results.

### Documents Page

Location: `apps/web/src/app/documents/page.js`

A full page for managing documents:
- Upload new documents
- View list of uploaded documents
- Delete documents
- Shows file type icons, sizes, and dates

## Backend API

### Upload Endpoint

```
POST /api/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary file data>
```

**Response:**
```json
{
  "message": "Document uploaded successfully",
  "document": {
    "id": "uuid",
    "user_id": "uuid",
    "original_filename": "notes.pdf",
    "file_type": "pdf",
    "file_size": 1234567,
    "storage_path": "user-id/timestamp-uuid.pdf",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### List Documents

```
GET /api/documents
Authorization: Bearer <token>
```

**Response:**
```json
{
  "documents": [
    {
      "id": "uuid",
      "original_filename": "notes.pdf",
      "file_type": "pdf",
      "file_size": 1234567,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1
}
```

### Delete Document

```
DELETE /api/documents/{document_id}
Authorization: Bearer <token>
```

Returns `204 No Content` on success.

## Backend Implementation

### Router

Location: `apps/api/app/documents/router.py`

```python
@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile,
    current_user: CurrentUser,
    db: DbSession,
):
    document = await DocumentService.upload(
        db=db,
        file=file,
        user_id=current_user.user_id,
    )
    return DocumentUploadResponse(
        message="Document uploaded successfully",
        document=DocumentResponse.model_validate(document),
    )
```

### Service Layer

Location: `apps/api/app/documents/service.py`

The `DocumentService` class handles:
1. Validating file type and size
2. Uploading to Supabase Storage
3. Creating database record
4. Deleting files and records

### Database Model

Location: `apps/api/app/documents/models.py`

```python
class Document(Base):
    __tablename__ = "documents"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(nullable=False, index=True)
    original_filename: Mapped[str] = mapped_column(nullable=False)
    file_type: Mapped[str] = mapped_column(nullable=False)
    file_size: Mapped[int] = mapped_column(nullable=False)
    storage_path: Mapped[str] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
```

## Supabase Storage Setup

### Create Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Click "New Bucket"
3. Name it `documents`
4. Set to **private** (not public)

### Storage Policies (RLS)

Run these SQL commands in Supabase SQL Editor:

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to read their own files
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

## File Storage Structure

Files are stored in Supabase Storage with the path:
```
documents/{user_id}/{timestamp}_{uuid}.{extension}
```

Example:
```
documents/550e8400-e29b-41d4-a716-446655440000/1705312200_abc123.pdf
```

## Supported File Types

| Type | Extensions | MIME Type |
|------|------------|-----------|
| PDF | .pdf | application/pdf |
| PNG | .png | image/png |
| JPEG | .jpg, .jpeg | image/jpeg |

## Configuration

### Upload Limits

In `apps/api/app/core/config.py`:
```python
max_upload_size_mb: int = 10  # Maximum file size in MB
```

### Storage Bucket

In `apps/api/app/core/config.py`:
```python
supabase_storage_bucket: str = "documents"  # Bucket name
```

## Error Handling

### Frontend Errors

The `DocumentUpload` component displays errors for:
- File too large (> 10MB)
- Unsupported file type
- Network errors
- Authentication errors ("You must be logged in")

### Backend Errors

| Status | Error | Cause |
|--------|-------|-------|
| 400 | Unsupported file type | File extension not in allowed list |
| 400 | File too large | Exceeds `max_upload_size_mb` |
| 401 | Unauthorized | Missing or invalid token |
| 500 | Upload failed | Supabase Storage error |

## Development Mode

In development mode (`DEBUG=true`), uploads work without authentication:

1. Frontend sends `dev-token` as the Bearer token
2. Backend bypasses JWT validation
3. Uses `DEV_USER_ID` as the user ID for storage path

See [Authentication](./authentication.md) for details on the dev mode bypass.
