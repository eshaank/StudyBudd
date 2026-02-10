"""FastAPI dependencies for authentication and database access."""

import logging
from collections.abc import AsyncGenerator
from functools import lru_cache
from typing import Annotated
from urllib.parse import urlparse
from uuid import UUID

import jwt
from jwt import PyJWKClient
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import async_session_maker

logger = logging.getLogger(__name__)
settings = get_settings()
security = HTTPBearer()


# =============================================================================
# JWKS Client (cached)
# =============================================================================


@lru_cache(maxsize=1)
def get_jwks_client() -> PyJWKClient | None:
    """Get cached JWKS client for Supabase.
    
    Returns:
        PyJWKClient instance or None if Supabase URL not configured.
    """
    if not settings.supabase_url:
        return None
    
    # Build JWKS URL from Supabase project URL
    # e.g., https://xyz.supabase.co -> https://xyz.supabase.co/auth/v1/.well-known/jwks.json
    base_url = settings.supabase_url.rstrip("/")
    jwks_url = f"{base_url}/auth/v1/.well-known/jwks.json"
    
    return PyJWKClient(jwks_url, cache_keys=True)


# =============================================================================
# Authentication
# =============================================================================


class AuthenticatedUser:
    """Authenticated user extracted from Supabase JWT."""

    def __init__(self, user_id: UUID, email: str | None = None) -> None:
        """Initialize authenticated user.

        Args:
            user_id: The user's unique identifier.
            email: The user's email address (optional).
        """
        self.user_id = user_id
        self.email = email


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
) -> AuthenticatedUser:
    """Verify Supabase JWT token and extract user information.

    Supports both:
    - ES256 (ECC P-256) - Supabase's new default
    - HS256 (Legacy shared secret) - for backwards compatibility

    Args:
        credentials: HTTP Bearer token from Authorization header.

    Returns:
        AuthenticatedUser with user_id and email.

    Raises:
        HTTPException: If token is invalid or expired.
    """
    token = credentials.credentials

    # Dev mode bypass: if debug=True and dev_user_id is set, skip JWT validation
    if settings.debug and settings.dev_user_id:
        logger.debug("auth bypass dev_user_id=%s", settings.dev_user_id)
        return AuthenticatedUser(
            user_id=UUID(settings.dev_user_id),
            email="dev@localhost",
        )

    # Try to decode the token header to determine algorithm
    try:
        unverified_header = jwt.get_unverified_header(token)
        alg = unverified_header.get("alg", "HS256")
    except jwt.exceptions.DecodeError as e:
        logger.warning("auth failed invalid token format: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token format: {e!s}",
        )

    try:
        # Use JWKS for ES256/RS256 (asymmetric algorithms)
        if alg in ("ES256", "RS256", "ES384", "RS384", "ES512", "RS512"):
            jwks_client = get_jwks_client()
            if not jwks_client:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="JWKS not configured. Set SUPABASE_URL in environment.",
                )
            
            # Get the signing key from JWKS
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=[alg],
                audience="authenticated",
            )
        
        # Use shared secret for HS256 (symmetric algorithm)
        elif alg == "HS256":
            if not settings.supabase_jwt_secret:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Supabase JWT secret not configured for HS256",
                )
            
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
        
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Unsupported JWT algorithm: {alg}",
            )

        user_id_str = payload.get("sub")
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing user ID",
            )

        user_id = UUID(user_id_str)
        email = payload.get("email")

        return AuthenticatedUser(user_id=user_id, email=email)

    except jwt.ExpiredSignatureError:
        logger.warning("auth failed token expired")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.InvalidTokenError as e:
        logger.warning("auth failed invalid token: %s", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e!s}",
        )


# =============================================================================
# Database
# =============================================================================


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting async database sessions.

    Yields:
        AsyncSession: SQLAlchemy async session.
    """
    async with async_session_maker() as session:
        yield session


# =============================================================================
# Type Aliases for Dependency Injection
# =============================================================================

CurrentUser = Annotated[AuthenticatedUser, Depends(get_current_user)]
DbSession = Annotated[AsyncSession, Depends(get_db)]
