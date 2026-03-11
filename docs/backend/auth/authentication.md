# Authentication

StudyBudd uses [Supabase Auth](https://supabase.com/docs/guides/auth) for user authentication. This document explains how authentication works and how to bypass it during development.

## Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│  Supabase   │────▶│   Backend   │
│  (Next.js)  │     │    Auth     │     │  (FastAPI)  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       │  1. User login    │                   │
       │──────────────────▶│                   │
       │                   │                   │
       │  2. JWT token     │                   │
       │◀──────────────────│                   │
       │                   │                   │
       │  3. API request with Bearer token     │
       │──────────────────────────────────────▶│
       │                   │                   │
       │                   │  4. Validate JWT  │
       │                   │◀──────────────────│
```

## Production Flow

1. User logs in via Supabase Auth (email/password or OAuth)
2. Frontend receives a JWT access token
3. Frontend includes the token in API requests: `Authorization: Bearer <token>`
4. Backend validates the JWT using the Supabase JWT secret
5. Backend extracts user ID from the token's `sub` claim

## Development Mode Bypass

To simplify local development, authentication can be bypassed when `DEBUG=true`.

### Backend Configuration

In `apps/api/app/core/config.py`:

```python
class Settings(BaseSettings):
    debug: bool = False
    dev_user_id: str | None = None  # UUID to use when bypassing auth
```

In `apps/api/app/core/dependencies.py`:

```python
def get_current_user(credentials):
    # Dev mode bypass: if debug=True and dev_user_id is set, skip JWT validation
    if settings.debug and settings.dev_user_id:
        return AuthenticatedUser(
            user_id=UUID(settings.dev_user_id),
            email="dev@localhost",
        )
    
    # Otherwise, validate JWT normally...
```

### Frontend Configuration

In development mode, the frontend sends a placeholder token when no session exists:

```javascript
// apps/web/src/12app/components/DocumentUpload.jsx
const isDev = process.env.NODE_ENV === "development";
const devToken = process.env.NEXT_PUBLIC_DEV_ACCESS_TOKEN || "dev-token";
const accessToken = session?.access_token || (isDev ? devToken : null);
```

The Documents page also uses a mock user in dev mode:

```javascript
// apps/web/src/app/documents/page.js
if (isDev) {
  setUser({ id: "dev-user", email: "dev@localhost" });
  return;
}
```

### Environment Variables for Dev Mode

Add these to your `.env` file:

```bash
# Enable development mode
DEBUG=true

# UUID to use as the authenticated user in dev mode
DEV_USER_ID=00000000-0000-0000-0000-000000000001
```

### Security Warning

**Never enable `DEBUG=true` in production!** This completely bypasses authentication and allows anyone to access the API as the configured dev user.

## JWT Validation

When not in dev mode, the backend validates JWTs using PyJWT:

```python
payload = jwt.decode(
    token,
    settings.supabase_jwt_secret,
    algorithms=["HS256"],
    audience="authenticated",
)

user_id = UUID(payload.get("sub"))
email = payload.get("email")
```

The JWT must:
- Be signed with the Supabase JWT secret
- Have the `authenticated` audience
- Contain a `sub` claim with the user's UUID
- Not be expired

## Supabase Client Setup

### Browser Client (Client-side)

```javascript
// apps/web/src/lib/supabase/client.js
import { createClient } from "@supabase/supabase-js";

export function createSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(url, anon);
}
```

### Server Client (Server-side/API routes)

```javascript
// apps/web/src/lib/supabase/server.js
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { /* cookie handlers */ } }
  );
}
```

## Auth Callback Route

The OAuth callback route handles the redirect after Supabase authentication:

```javascript
// apps/web/src/app/auth/callback/route.js
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  
  if (code) {
    const supabase = await createSupabaseServer();
    await supabase.auth.exchangeCodeForSession(code);
  }
  
  return NextResponse.redirect(`${origin}/`);
}
```

## Common Issues

### "Multiple GoTrueClient instances detected"

This warning appears when `createSupabaseBrowser()` is called multiple times. It's not an error but can be avoided by:
1. Creating a singleton client
2. Using React Context to share the client

### Token Expired

Supabase tokens expire after 1 hour by default. The Supabase client automatically refreshes tokens, but if you see 401 errors:
1. Check if the session is still valid: `supabase.auth.getSession()`
2. Sign out and sign back in
3. Verify your system clock is accurate
