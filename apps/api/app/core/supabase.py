"""Supabase client factory and storage operations."""

import uuid
from uuid import UUID

from fastapi import HTTPException, status
from supabase import Client, create_client

from app.core.config import get_settings

settings = get_settings()


def get_supabase_client() -> Client:
    """Create and return a configured Supabase client.

    Returns:
        Supabase client instance.

    Raises:
        HTTPException: If Supabase configuration is missing.
    """
    if not settings.supabase_url or not settings.supabase_service_key:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase configuration not set",
        )
    return create_client(settings.supabase_url, settings.supabase_service_key)


async def upload_file(
    content: bytes,
    user_id: UUID,
    filename: str,
    content_type: str,
    bucket: str | None = None,
) -> str:
    """Upload a file to Supabase Storage.

    Args:
        content: File content as bytes.
        user_id: User ID for organizing files.
        filename: Original filename (used for extension).
        content_type: MIME type of the file.
        bucket: Storage bucket name (defaults to config value).

    Returns:
        Storage path where file was uploaded.

    Raises:
        HTTPException: If upload fails or file is too large.
    """
    # Check file size
    file_size = len(content)
    max_size = settings.max_upload_size_mb * 1024 * 1024
    if file_size > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum allowed size of {settings.max_upload_size_mb}MB",
        )

    # Generate unique filename preserving extension
    file_ext = filename.rsplit(".", 1)[-1] if "." in filename else "bin"
    unique_filename = f"{uuid.uuid4()}.{file_ext}"
    storage_path = f"{user_id}/{unique_filename}"

    # Upload to Supabase Storage
    bucket_name = bucket or settings.supabase_storage_bucket
    try:
        client = get_supabase_client()
        client.storage.from_(bucket_name).upload(
            path=storage_path,
            file=content,
            file_options={"content-type": content_type},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload file: {e!s}",
        )

    return storage_path


def download_file(storage_path: str, bucket: str | None = None) -> bytes:
    """Download a file from Supabase Storage.

    Args:
        storage_path: Path to the file in storage.
        bucket: Storage bucket name (defaults to config value).

    Returns:
        File content as bytes.

    Raises:
        HTTPException: If download fails.
    """
    bucket_name = bucket or settings.supabase_storage_bucket
    try:
        client = get_supabase_client()
        data = client.storage.from_(bucket_name).download(storage_path)
        return data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to download file: {e!s}",
        )


def delete_file(storage_path: str, bucket: str | None = None) -> bool:
    """Delete a file from Supabase Storage.

    Args:
        storage_path: Path to the file in storage.
        bucket: Storage bucket name (defaults to config value).

    Returns:
        True if deletion succeeded, False otherwise.
    """
    bucket_name = bucket or settings.supabase_storage_bucket
    try:
        client = get_supabase_client()
        client.storage.from_(bucket_name).remove([storage_path])
        return True
    except Exception:
        # Log error but don't raise - caller can decide how to handle
        return False


def get_public_url(storage_path: str, bucket: str | None = None) -> str:
    """Get the public URL for a file in Supabase Storage.

    Args:
        storage_path: Path to the file in storage.
        bucket: Storage bucket name (defaults to config value).

    Returns:
        Public URL for the file.
    """
    bucket_name = bucket or settings.supabase_storage_bucket
    client = get_supabase_client()
    return client.storage.from_(bucket_name).get_public_url(storage_path)
