# Stage 1: Builder
FROM python:3.12-slim AS builder

WORKDIR /app

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Copy dependency files and app (needed for package install)
COPY pyproject.toml uv.lock* ./
COPY app/ ./app/

# Install dependencies
RUN uv sync --no-dev

# Stage 2: Runner
FROM python:3.12-slim AS runner

WORKDIR /app

# Create non-root user
RUN groupadd --system --gid 1001 python && \
    useradd --system --uid 1001 --gid python appuser

# Copy uv and virtual environment from builder
COPY --from=builder /usr/local/bin/uv /usr/local/bin/uv
COPY --from=builder /app/.venv /app/.venv

# Copy application code
COPY . .

# Set ownership
RUN chown -R appuser:python /app

USER appuser

# Add venv to PATH
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
