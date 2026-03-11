# RAG Processing Setup (Supabase)

The RAG processing tables require the **pgvector** extension in your Supabase database.

## 1. Enable pgvector in Supabase

**Before running migrations**, enable the extension:

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Database** → **Extensions** (in the sidebar)
4. Search for **"vector"**
5. Click **Enable** on the pgvector extension

## 2. Use the direct database connection for migrations

Supabase has two connection modes:

- **Pooler** (port 6543, `*-pooler.supabase.com`) – transaction mode; not suitable for `CREATE EXTENSION`
- **Direct** (port 5432) – use this for migrations

**Option A (recommended):** Keep `DATABASE_URL` or `DB_HOST` as the pooler for the app, and set **`DB_MIGRATION_HOST`** to the direct host for migrations only:

```env
DB_MIGRATION_HOST=aws-0-us-west-2.supabase.com
```

Alembic will use this host (with the same user, password, port, and database as your normal config) when you run `alembic upgrade head`.

**Option B:** Point `DATABASE_URL` at the direct connection when running migrations (e.g. host `aws-0-[region].supabase.com`, port 5432), then switch back to the pooler for the app.

## 3. Run the migration

```bash
cd apps/api
uv run python -m alembic upgrade head
```

## 4. Verify

You should see `processing_documents` and `document_chunks` tables in **Database** → **Tables** in the Supabase dashboard.

## If you see "nodename nor servname provided, or not known"

This means your machine **cannot resolve the database hostname** (e.g. `aws-0-us-west-2.supabase.com`) via DNS.

1. **Check from your Mac** (in Terminal):
   ```bash
   ping -c 1 aws-0-us-west-2.supabase.com
   ```
   If this fails with "Unknown host" or "cannot resolve", it's a DNS/network issue on your machine.

2. **Try**:
   - A different network (e.g. phone hotspot, different Wi‑Fi) and run `alembic upgrade head` again.
   - Disabling VPN temporarily if you use one (some VPNs break or override DNS).
   - Using Google DNS: System Settings → Network → Wi‑Fi → Details → DNS → add `8.8.8.8`.

3. **Workaround without DNS**: Run the migration SQL directly in the Supabase **SQL Editor** (see below), then update `alembic_version` in the SQL Editor so you don't need a local DB connection. `alembic stamp head` would also require resolving the host, so use the SQL Editor for both.

## If the migration still fails with "type vector does not exist"

1. **Confirm the extension is enabled**  
   Database → Extensions → "vector" must show as enabled.

2. **Confirm you are using the direct connection**  
   Your `DATABASE_URL` must use port **5432** and the host **without** `-pooler` (e.g. `aws-0-us-west-1.supabase.com`, not `aws-0-us-west-1.pooler.supabase.com`).

3. **Optional: create tables via SQL Editor**  
   In Supabase go to **Database** → **SQL Editor** and run:

   If pgvector is in the **`vector_db`** schema (Supabase Vector / Dashboard Extensions), use the schema-qualified type and operator class:

   ```sql
   CREATE TABLE IF NOT EXISTS processing_documents (
       id UUID NOT NULL PRIMARY KEY,
       title VARCHAR(255) NOT NULL DEFAULT 'untitled',
       status VARCHAR(32) NOT NULL DEFAULT 'pending',
       error TEXT,
       created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
       updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
   );

   CREATE TABLE IF NOT EXISTS document_chunks (
       id UUID NOT NULL PRIMARY KEY,
       document_id UUID NOT NULL REFERENCES processing_documents(id) ON DELETE CASCADE,
       chunk_index INTEGER NOT NULL,
       content TEXT NOT NULL,
       metadata JSONB NOT NULL DEFAULT '{}',
       embedding vector_db.vector(768) NOT NULL,
       created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
   );

   CREATE INDEX IF NOT EXISTS ix_document_chunks_document_id ON document_chunks (document_id);
   CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks USING hnsw (embedding vector_db.vector_cosine_ops);
   ```

   Then mark the migration as applied:

   - **If your machine can reach the DB:** from `apps/api` run `uv run python -m alembic stamp head`.
   - **If you can't (e.g. DNS: "nodename nor servname"):** run this in Supabase **SQL Editor** so Alembic considers migrations applied without a local connection:

   ```sql
   CREATE TABLE IF NOT EXISTS alembic_version (
       version_num VARCHAR(32) NOT NULL PRIMARY KEY
   );
   DELETE FROM alembic_version;
   INSERT INTO alembic_version (version_num) VALUES ('20260211_000001');
   ```

## If only `vector_db.vector` exists and vector search fails

If you see only `vector_db.vector` in the database (e.g. from enabling "Vector" in the dashboard) and queries fail with **operator does not exist: vector_db.vector <-> vector_db.vector**:

1. **Run the migration that enables pgvector in `public`** so the standard distance operators work:
   ```bash
   cd apps/api
   uv run python -m alembic upgrade head
   ```
   Migration `20260212_000001` runs `CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public` and migrates `document_chunks.embedding` from `vector_db.vector` to `public.vector`.

2. **Use the direct connection** (port 5432) when running migrations; see "Use the direct database connection for migrations" above.

3. After this, RAG query uses `public.vector` and the cosine operator `<=>` for similarity search.

## If the app says "type … vector does not exist" or 503 "Vector type not found"

The **pooler** (port 6543) sometimes doesn’t see the pgvector type. Use the **direct** connection for the app:

- Set `DATABASE_URL` (or `DB_HOST`) to the direct host and port **5432** (e.g. `postgresql+asyncpg://…@aws-0-us-west-2.supabase.com:5432/…`), not the pooler URL with port 6543.

The app resolves the vector type schema on each RAG query, so it works with whichever schema your connection exposes (`public`, `extensions`, or `vector_db`).

## Apply migration 20260212 via SQL Editor (when DNS fails)

If you get **could not translate host name "aws-0-us-west-2.supabase.com" to address** when running `alembic upgrade head`, run the migration inside Supabase so no local connection is needed.

1. In Supabase go to **Database** → **SQL Editor**.
2. Run this script (it creates `public.vector` and migrates `document_chunks.embedding` from `vector_db.vector` if needed):

```sql
-- Migration 20260212_000001: use pgvector type (public or extensions) and migrate embedding column
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

DO $$
DECLARE
  vec_schema text;   -- schema where vector type with operators lives (public or extensions)
  col_schema text;
  col_type text;
BEGIN
  -- Resolve which schema has the vector type (Supabase may install in extensions, not public)
  SELECT n.nspname INTO vec_schema
  FROM pg_type t
  JOIN pg_namespace n ON t.typnamespace = n.oid
  WHERE t.typname = 'vector'
  ORDER BY CASE n.nspname WHEN 'public' THEN 0 WHEN 'extensions' THEN 1 ELSE 2 END
  LIMIT 1;

  IF vec_schema IS NULL THEN
    RAISE EXCEPTION 'vector type not found. Enable pgvector: Database → Extensions → vector';
  END IF;

  SELECT n.nspname, t.typname INTO col_schema, col_type
  FROM pg_attribute a
  JOIN pg_type t ON a.atttypid = t.oid
  JOIN pg_namespace n ON t.typnamespace = n.oid
  JOIN pg_class c ON a.attrelid = c.oid
  JOIN pg_namespace nc ON c.relnamespace = nc.oid
  WHERE nc.nspname = 'public' AND c.relname = 'document_chunks'
    AND a.attname = 'embedding' AND NOT a.attisdropped;

  IF col_schema IS NULL THEN
    RETURN;
  END IF;

  IF col_schema = vec_schema AND col_type = 'vector' THEN
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks USING hnsw (embedding %I.vector_cosine_ops)', vec_schema);
    RETURN;
  END IF;

  EXECUTE 'DROP INDEX IF EXISTS idx_document_chunks_embedding';
  EXECUTE format('ALTER TABLE document_chunks ADD COLUMN IF NOT EXISTS embedding_new %I.vector(768)', vec_schema);
  EXECUTE format('UPDATE document_chunks SET embedding_new = (embedding::text)::%I.vector(768)', vec_schema);
  EXECUTE 'ALTER TABLE document_chunks DROP COLUMN embedding';
  EXECUTE 'ALTER TABLE document_chunks RENAME COLUMN embedding_new TO embedding';
  EXECUTE 'ALTER TABLE document_chunks ALTER COLUMN embedding SET NOT NULL';
  EXECUTE format('CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding ON document_chunks USING hnsw (embedding %I.vector_cosine_ops)', vec_schema);
END $$;
```

3. Mark the migration as applied so Alembic stays in sync. In the SQL Editor run:

```sql
CREATE TABLE IF NOT EXISTS alembic_version (
    version_num VARCHAR(32) NOT NULL PRIMARY KEY
);
UPDATE alembic_version SET version_num = '20260212_000001' WHERE version_num = '20260211_000001';
```

If you had no migrations applied yet (empty `alembic_version`), run this instead of the `UPDATE`:

```sql
INSERT INTO alembic_version (version_num) VALUES ('20260212_000001');
```
