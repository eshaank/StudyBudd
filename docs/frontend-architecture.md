# Frontend Architecture

This document maps the full frontend system — how the Next.js app is structured, where data flows, and how it splits between direct Supabase access and backend API calls.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        BROWSER (Next.js App)                           │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Pages (App Router)                           │   │
│  │                                                                   │   │
│  │   Landing    Login/Signup    Dashboard    Chat    Files           │   │
│  │   Features   OAuth Callback  Account     Quizzes  Flashcards    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                          │                                              │
│  ┌───────────────────────┼─────────────────────────────────────────┐   │
│  │              Global Providers (Root Layout)                      │   │
│  │                                                                   │   │
│  │       NotificationsContext          PomodoroProvider              │   │
│  └───────────────────────┼─────────────────────────────────────────┘   │
│                          │                                              │
│  ┌───────────────────────┼─────────────────────────────────────────┐   │
│  │                   Client Layer                                    │   │
│  │                                                                   │   │
│  │   Supabase Browser Client    Axios HTTP Client    Fetch + SSE    │   │
│  └───────┬──────────────────────────┬──────────────────┬───────────┘   │
│           │                          │                  │               │
└───────────┼──────────────────────────┼──────────────────┼───────────────┘
            │                          │                  │
            ▼                          ▼                  ▼
┌─────────────────────┐   ┌────────────────────────────────────────────┐
│  SUPABASE (Direct)  │   │         FASTAPI BACKEND (:8000)            │
│                     │   │                                             │
│  - Auth service     │   │  /chat/stream    (SSE streaming)           │
│  - profiles table   │   │  /conversations  (CRUD)                    │
│  - pomodoro_sessions│   │  /files/upload   (RAG indexing)            │
│  - productivity_days│   │                                             │
│  - Storage bucket   │   │         │                                   │
└─────────────────────┘   │         ▼                                   │
                          │  ┌─────────────────┐                       │
                          │  │  Together AI     │                       │
                          │  │  (LLM Provider)  │                       │
                          │  └─────────────────┘                       │
                          └────────────────────────────────────────────┘
```

---

## The Two Data Paths

The frontend talks to two backends depending on the operation. This is the core architectural split.

```
                        ┌──────────────────┐
                        │  React Component │
                        └────────┬─────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
                 ▼                               ▼
   ┌─────────────────────────┐    ┌─────────────────────────────┐
   │  PATH 1: Direct Supabase│    │  PATH 2: Backend API         │
   │                          │    │                               │
   │  Supabase Client         │    │  Axios / Fetch                │
   │  (anon key + RLS)        │    │  (Bearer token in header)     │
   │         │                │    │         │                     │
   │         ▼                │    │         ▼                     │
   │  ┌──────────────┐       │    │  ┌──────────────────┐        │
   │  │ Supabase     │       │    │  │ FastAPI (:8000)  │        │
   │  │ Postgres     │       │    │  └────────┬─────────┘        │
   │  │ (RLS rules)  │       │    │           │                   │
   │  └──────────────┘       │    │     ┌─────┴──────┐           │
   │  ┌──────────────┐       │    │     ▼            ▼           │
   │  │ Supabase     │       │    │  Supabase     Together AI    │
   │  │ Storage      │       │    │  Postgres     (LLM)          │
   │  └──────────────┘       │    │  (service key)               │
   └─────────────────────────┘    └─────────────────────────────┘
```

| What | Path | Why |
|------|------|-----|
| Auth (login, signup, OAuth) | Direct Supabase | Supabase handles sessions, cookies, token refresh natively |
| Profile read/update | Direct Supabase | Simple CRUD on `profiles` table, RLS protects per-user rows |
| Pomodoro session logging | Direct Supabase | Insert-only writes to `pomodoro_sessions` + upsert `productivity_days` |
| File upload/list/delete | Both | Upload goes to Supabase Storage; metadata + RAG indexing go through API |
| Chat streaming | Backend API | Requires LLM orchestration, history building, SSE streaming |
| Conversation CRUD | Backend API | Backend owns conversation/message schema and RAG context |

---

## Authentication Flow

### Email/Password Login

```
User                  Middleware             Login Page           Supabase Auth        Cookies
 │                        │                      │                     │                  │
 │── GET /dashboard ─────>│                      │                     │                  │
 │                        │── getUser() ────────>│                     │                  │
 │                        │<── No session ───────│                     │                  │
 │<── 302 /login?redirect │                      │                     │                  │
 │                        │                      │                     │                  │
 │── Enter email+password ──────────────────────>│                     │                  │
 │                        │                      │── signInWithPassword() ──>│            │
 │                        │                      │<── session (tokens) ──────│            │
 │                        │                      │                     │── set cookies ──>│
 │<── router.push(/dashboard) ──────────────────│                     │                  │
 │                        │                      │                     │                  │
 │── GET /dashboard ─────>│                      │                     │                  │
 │                        │── getUser() (cookies) ─────────────────────>│                 │
 │                        │<── Valid user ──────────────────────────────│                 │
 │<── 200 Dashboard ──────│                      │                     │                  │
```

### Google OAuth

```
User              Login Page         Supabase Auth        Google            /auth/callback
 │                    │                    │                  │                    │
 │── Click Google ───>│                    │                  │                    │
 │                    │── signInWithOAuth() ──>│              │                    │
 │<── 302 Google consent screen ──────────────│              │                    │
 │                    │                    │                  │                    │
 │── Grant access ──────────────────────────────────────────>│                    │
 │                    │                    │                  │── 302 ?code=xxx ──>│
 │                    │                    │<── exchangeCodeForSession(code) ─────│
 │                    │                    │── session created ──────────────────>│
 │<── 302 /dashboard ───────────────────────────────────────────────────────────│
```

### How the Token Reaches the API

```
supabase.auth.getSession()  ──>  session.access_token  ──>  Authorization: Bearer <token>
                                                                       │
                                                                       ▼
                                                              FastAPI Backend
                                                                       │
                                                                       ▼
                                                            Decode JWT --> user_id
```

Every API call extracts the access token from the Supabase session and sends it as a Bearer header. The backend decodes the JWT to identify the user — no separate login needed.

---

## Routing and Middleware

```
                    ┌──────────────────┐
                    │ Incoming Request  │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  middleware.js    │
                    └────────┬─────────┘
                             │
                             ▼
                  ┌────────────────────┐
                  │ supabase.auth      │
                  │   .getUser()       │
                  └──────┬───────┬─────┘
                         │       │
              Valid session     No session
                         │       │
                         ▼       ▼
              ┌──────────┐   ┌────────────────┐
              │Route type?│   │Protected route?│
              └──┬────┬──┘   └──┬──────────┬──┘
                 │    │         │          │
          /login │    │ other   │ yes      │ no
          /signup│    │         │          │
                 ▼    ▼         ▼          ▼
              302 to  Allow   302 to     Allow
             /dashboard       /login?
                             redirect=path
```

### Route Map

```
Public                    Protected (auth required)
─────────                 ────────────────────────
/                         /dashboard
/features                 /dashboard/chat
/pricing                  /dashboard/files
/quizzes                  /dashboard/quizzes
/contact                  /dashboard/flashcards
/(auth)/login             /account
/(auth)/signup
/auth/callback
```

---

## State Management

```
┌───────────────────────────────────────────────────────────┐
│                  Root Layout (layout.js)                    │
│                                                             │
│   ┌─────────────────────┐  ┌─────────────────────────┐    │
│   │ NotificationsProvider│  │   PomodoroProvider       │    │
│   │                     │  │          │                │    │
│   │  notifications[]    │  │   ┌──────▼──────┐        │    │
│   │  unreadCount        │  │   │ localStorage │        │    │
│   │  addNotification()  │  │   │ (persist     │        │    │
│   │  markAllRead()      │  │   │  timer state)│        │    │
│   │  clearAll()         │  │   └─────────────┘        │    │
│   └────────┬────────────┘  └──────────┬───────────────┘    │
│            │                          │                     │
└────────────┼──────────────────────────┼─────────────────────┘
             │                          │
     ┌───────┴──────────────────────────┴───────────┐
     │            Consuming Components               │
     │                                                │
     │  Navbar ──────── auth state (onAuthStateChange)│
     │       └──────── notifications (context)        │
     │  Sidebar ─────── pomodoro card (context)       │
     │  Chat Page ───── local useState (messages)     │
     │  Account Page ── local useState (profile)      │
     │  Login Page ──── URL query params (?redirect=) │
     └────────────────────────────────────────────────┘
```

No global store (Redux, Zustand). State is managed via:

1. **React Context** — notifications and pomodoro timer (app-wide)
2. **Supabase auth listener** — `onAuthStateChange` keeps auth state in sync
3. **Component-local `useState`** — each page manages its own data
4. **localStorage** — pomodoro timer persists across page navigations

---

## Chat Page Architecture (Deep Dive)

The chat page is the most complex frontend component. It combines REST API calls, SSE streaming, and local state management.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Chat Page (page.js)                           │
│                                                                       │
│  ┌──────────────────┐  ┌──────────────────────────────────────────┐ │
│  │  Sidebar Panel    │  │  Main Area                                │ │
│  │                    │  │                                            │ │
│  │  [+ New Chat]     │  │  ┌──────────────────────────────────┐    │ │
│  │                    │  │  │  Message Bubbles                  │    │ │
│  │  Search threads    │  │  │                                    │    │ │
│  │                    │  │  │  User:  "Explain recursion"       │    │ │
│  │  ┌──────────────┐ │  │  │  AI:    "Recursion is when..."    │    │ │
│  │  │ Thread 1     │ │  │  │         [Sources: file.pdf]       │    │ │
│  │  │ Thread 2  ◄──│─│──│──│  (active thread messages)         │    │ │
│  │  │ Thread 3     │ │  │  │                                    │    │ │
│  │  └──────────────┘ │  │  └──────────────────────────────────┘    │ │
│  │                    │  │                                            │ │
│  │  Rename / Delete   │  │  ┌──────────────────────────────────┐    │ │
│  │                    │  │  │  Input Bar                        │    │ │
│  │                    │  │  │  [+] │ Type a message...  │ Send  │    │ │
│  │                    │  │  └──────────────────────────────────┘    │ │
│  └──────────────────┘  └──────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
┌─────────────────┐           ┌─────────────────────────┐
│   Local State    │           │     Backend API          │
│                   │           │                           │
│  threads[]  <────────────────── GET /conversations      │
│  messages[] <────────────────── GET /conversations/:id  │
│  activeId        │           │                           │
│  streaming       │           │                           │
│  accessToken     │           │                           │
└────────┬────────┘           └────────────┬──────────────┘
         │                                  │
         │    ┌──── on mount ──────────────>│ List conversations
         │    │                             │
         │    ├──── click thread ──────────>│ Get messages
         │    │                             │
         │    ├──── send message ──────────>│ POST /chat/stream (SSE)
         │    │                             │
         │    ├──── rename ────────────────>│ PATCH /conversations/:id
         │    │                             │
         │    └──── delete ────────────────>│ DELETE /conversations/:id
         │                                  │
```

### Message Streaming Sequence

```
User            Chat UI           React State        POST /chat/stream     Together AI
 │                 │                    │                    │                   │
 │── type + send ─>│                    │                    │                   │
 │                 │── add user msg ───>│                    │                   │
 │                 │── add empty AI ───>│                    │                   │
 │                 │── fetch() ─────────────────────────────>│                   │
 │                 │                    │                    │── stream=True ───>│
 │                 │                    │                    │                   │
 │                 │                    │         ┌──── LOOP: SSE tokens ────┐  │
 │                 │                    │         │          │                │  │
 │                 │                    │         │   │<── chunk (delta) ────│  │
 │                 │<── event: token ───────────────────────│                │  │
 │                 │── append text ────>│         │          │                │  │
 │<── re-render ───│                    │         │          │                │  │
 │                 │                    │         └──────────┘                │  │
 │                 │                    │                    │                   │
 │                 │<── event: done ─────────────────────────│                  │
 │                 │── replace placeholder ─>│               │                  │
 │                 │── fetchThreads() ──────>│               │                  │
 │<── full response│                    │                    │                   │
```

---

## File Upload Flow

```
User             Files Page         Supabase Storage       Backend API         RAG Pipeline
 │                   │                     │                    │                   │
 │── drop file ─────>│                     │                    │                   │
 │                   │── upload blob ─────>│                    │                   │
 │                   │<── storage path ────│                    │                   │
 │                   │                     │                    │                   │
 │                   │── POST /files/upload (metadata + path) ─>│                  │
 │                   │                     │                    │── extract text ──>│
 │                   │                     │                    │── chunk + embed ─>│
 │                   │                     │                    │<── indexed ───────│
 │                   │<── 200 OK ──────────────────────────────│                   │
 │                   │                     │                    │                   │
 │                   │── refresh file list  │                   │                   │
 │                   │── addNotification("Upload complete")     │                  │
 │<── updated UI ────│                     │                    │                   │
```

---

## Component Hierarchy

```
layout.js (Root)
├── NotificationsProvider
│   └── PomodoroProvider
│       ├── Navbar
│       │   ├── Logo + nav links
│       │   ├── NotificationBell (uses NotificationsContext)
│       │   └── User avatar dropdown
│       │       ├── Dashboard link
│       │       ├── Account link
│       │       └── Sign out
│       │
│       ├── {children} ─── page content (varies by route)
│       │   │
│       │   ├── Landing page (/)
│       │   ├── Login page (/(auth)/login)
│       │   ├── Signup page (/(auth)/signup)
│       │   ├── Account page (/account)
│       │   │   ├── AvatarUploader
│       │   │   ├── Profile form
│       │   │   └── ProductivityHeatmap
│       │   │
│       │   └── Dashboard layout (/dashboard/*)
│       │       ├── Sidebar (sticky)
│       │       │   ├── Nav links (Files, Chat, Quizzes, Flashcards)
│       │       │   └── PomodoroSidebarCard
│       │       │       └── SVG progress ring + controls
│       │       │
│       │       └── {children} ─── dashboard page
│       │           ├── Dashboard home (/dashboard)
│       │           │   ├── Greeting header
│       │           │   ├── Continue Where You Left Off cards
│       │           │   ├── Your Tools grid
│       │           │   └── Upgrade CTA banner
│       │           │
│       │           ├── Chat (/dashboard/chat)
│       │           │   ├── Thread sidebar + search
│       │           │   ├── Message area + markdown renderer
│       │           │   └── Input bar + file attach
│       │           │
│       │           ├── Files (/dashboard/files)
│       │           │   ├── DocumentUpload (drag-and-drop)
│       │           │   └── File list table
│       │           │
│       │           ├── Quizzes (/dashboard/quizzes)
│       │           │   ├── Question + answer cards
│       │           │   ├── Progress ring
│       │           │   └── Results summary
│       │           │
│       │           └── Flashcards (/dashboard/flashcards)
│       │               ├── Deck switcher
│       │               ├── 3D flip card
│       │               └── Study mode tabs
│       │
│       └── Footer
```

---

## File Reference

| Layer | File | Purpose |
|-------|------|---------|
| Supabase client (browser) | `src/lib/supabase/client.js` | Creates browser-safe Supabase instance |
| Supabase client (server) | `src/lib/supabase/server.js` | Creates server client with cookie handling |
| Middleware | `src/middleware.js` | Route protection + session refresh |
| Root layout | `src/app/layout.js` | Wraps providers (notifications, pomodoro) |
| Dashboard layout | `src/app/dashboard/layout.jsx` | Sidebar + content grid |
| Chat page | `src/app/dashboard/chat/page.js` | SSE streaming, conversation management |
| Files page | `src/app/dashboard/files/page.js` | Upload, list, delete documents |
| Quizzes page | `src/app/dashboard/quizzes/page.js` | Interactive quiz flow |
| Flashcards page | `src/app/dashboard/flashcards/page.js` | 3D flip cards, deck management |
| Account page | `src/app/account/page.js` | Profile editing, avatar, heatmap |
| Login | `src/app/(auth)/login/page.js` | Email/password + Google OAuth |
| Signup | `src/app/(auth)/signup/page.js` | Registration form |
| OAuth callback | `src/app/auth/callback/route.js` | Exchange OAuth code for session |
| Profile helpers | `src/lib/profile.js` | Read/update `profiles` table |
| Pomodoro logging | `src/lib/pomodoro/logFocusCompletion.js` | Log sessions to Supabase |
| Pomodoro store | `src/app/components/pomodoroStore.js` | Timer state + localStorage persistence |
| Notifications | `src/app/components/NotificationsContext.jsx` | App-wide notification context |
| Navbar | `src/app/components/Navbar.jsx` | Top nav, auth state, user menu |
| Heatmap | `src/app/components/ProductivityHeatmap.jsx` | GitHub-style focus time grid |
