"""Main FastAPI application entry point."""

import logging
import os
import time

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.requests import Request
from pydantic import BaseModel
from supabase import create_client, Client

from app.core.config import get_settings
from app.documents.router import router as documents_router
from app.chat.router import router as chat_router
from app.processing.router import router as processing_router
from app.folders.router import router as folders_router

load_dotenv()

# --- 1. Logging Setup ---

logging.basicConfig(
    level=getattr(logging, get_settings().log_level.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# Silence noisy third-party loggers (httpcore, httpx, hpack, together)
for name in ("httpcore", "httpx", "hpack", "together"):
    logging.getLogger(name).setLevel(logging.WARNING)

# --- 2. Configuration & Setup ---

# Retrieve Supabase credentials
SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = (
    os.environ.get("SUPABASE_SERVICE_KEY") or 
    os.environ.get("SUPABASE_KEY") or 
    os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
)

# Initialize Supabase Client
supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("Supabase client initialized successfully.")
    except Exception as e:
        logger.exception("Error initializing Supabase: %s", e)
else:
    logger.warning(
        "Supabase credentials not found. URL=%s, KEY=%s",
        bool(SUPABASE_URL),
        bool(SUPABASE_KEY),
    )

# Initialize FastAPI App
app = FastAPI(
    title="StudyBudd API",
    description="Backend API for StudyBudd application",
    version="0.1.0",
)

# --- 3. Middleware ---

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log request method, path, status, and duration."""
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    logger.info(
        "%s %s %d %.2fms",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response

# --- 4. Register Routers ---

# Existing documents router
app.include_router(documents_router, prefix="/api")

# The router itself has prefix="/chat", so mounting it at "/api" results in "/api/chat"
app.include_router(chat_router, prefix="/api")

# Processing router (RAG: chunking, embeddings, query)
app.include_router(processing_router, prefix="/api")

# Folders router (organize documents by task)
app.include_router(folders_router, prefix="/api")

# --- 5. Data Models (Legacy/Auth) ---

class UserCredentials(BaseModel):
    """Schema for user login and registration."""
    email: str
    password: str

# --- 6. Global API Endpoints ---

@app.get("/")
async def root() -> dict[str, str]:
    """Root endpoint."""
    return {"message": "Welcome to StudyBudd API"}

@app.get("/health")
async def health_check():
    """Health check endpoint with DB status."""
    return {
        "status": "healthy", 
        "database_connected": supabase is not None
    }

@app.post("/api/auth/signup")
async def sign_up(credentials: UserCredentials):
    """Registers a new user using Supabase Auth."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database configuration missing.")

    try:
        response = supabase.auth.sign_up({
            "email": credentials.email,
            "password": credentials.password
        })
        return {"message": "User registered successfully", "user": response.user}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/auth/login")
async def login(credentials: UserCredentials):
    """Logs in an existing user and returns an access token."""
    if not supabase:
        raise HTTPException(status_code=500, detail="Database configuration missing.")

    try:
        response = supabase.auth.sign_in_with_password({
            "email": credentials.email,
            "password": credentials.password
        })
        return {
            "access_token": response.session.access_token,
            "user": {
                "id": response.user.id,
                "email": response.user.email
            }
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

# --- 7. Local Execution ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)