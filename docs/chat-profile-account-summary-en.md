# Chat and Profile / Account Feature Summary (English)

Branch: `ac-avatar-account`  
Goal: readable, presentable, and easy to trace back to code

## 1) What Calls What (Call Chain)

### Chat (Streaming Conversation) Call Chain

1. User sends a message from the Chat page.  
   Page wiring: `apps/web/src/app/dashboard/chat/page.js:49`, `apps/web/src/app/dashboard/chat/page.js:57`  
   Send entry point: `apps/web/src/app/dashboard/chat/hooks/useChatMessages.js:58`

2. Frontend calls `POST /api/chat/stream`.  
   Code: `apps/web/src/app/dashboard/chat/hooks/useChatMessages.js:79`

3. Backend Router receives the streaming request and enters `chat_stream`.  
   Code: `apps/api/app/chat/router.py:30`

4. Service processes streaming chat: create conversation if needed, persist user message, build message history, and call the Together model.  
   Code: `apps/api/app/chat/service.py:161`, `apps/api/app/chat/service.py:186`, `apps/api/app/chat/service.py:193`, `apps/api/app/chat/service.py:207`

5. If RAG is needed, backend executes the `search_my_documents` tool.  
   Tool schema / prompt: `apps/api/app/chat/tools.py:84`, `apps/api/app/chat/tools.py:107`  
   Retrieval execution: `apps/api/app/chat/tools.py:134`  
   Service tool path: `apps/api/app/chat/service.py:247`, `apps/api/app/chat/service.py:266`, `apps/api/app/chat/service.py:308`

6. Backend returns SSE `token` / `done` events; frontend appends chunks in real time and replaces the placeholder with the final stored message.  
   Backend: `apps/api/app/chat/service.py:299`, `apps/api/app/chat/service.py:400`  
   Frontend: `apps/web/src/app/dashboard/chat/hooks/useChatMessages.js:114`, `apps/web/src/app/dashboard/chat/hooks/useChatMessages.js:126`

7. Conversation list, history, rename, and delete all go through chat APIs as well.  
   Frontend: `apps/web/src/app/dashboard/chat/hooks/useThreads.js:20`, `apps/web/src/app/dashboard/chat/hooks/useThreads.js:57`, `apps/web/src/app/dashboard/chat/hooks/useThreads.js:97`  
   Backend: `apps/api/app/chat/router.py:49`, `apps/api/app/chat/router.py:59`, `apps/api/app/chat/router.py:68`, `apps/api/app/chat/router.py:90`

### Profile / Account Call Chain

1. User opens `/account`; frontend reads the current Supabase user and then queries `profiles.full_name`.  
   Code: `apps/web/src/app/account/page.js:20`, `apps/web/src/app/account/page.js:28`, `apps/web/src/app/account/page.js:41`

2. User edits the name and clicks `Save changes`.  
   Entry point: `apps/web/src/app/account/page.js:92`  
   `profiles.upsert(...)` for `full_name`: `apps/web/src/app/account/page.js:106`

3. After saving, frontend dispatches the `studybudd:profile-updated` event.  
   Code: `apps/web/src/app/account/page.js:115`, `apps/web/src/lib/profile.js:33`

4. Navbar listens for that event, reloads `profiles`, and prefers `profiles.full_name` for display.  
   Code: `apps/web/src/app/components/Navbar.jsx:50`, `apps/web/src/app/components/Navbar.jsx:68`, `apps/web/src/app/components/Navbar.jsx:105`, `apps/web/src/app/components/Navbar.jsx:144`

5. When the user uploads an avatar, frontend writes the file to the private `avatars` bucket at `{user_id}/avatar.ext`.  
   Entry point: `apps/web/src/app/components/AvatarUploader.jsx:49`  
   Storage upload: `apps/web/src/app/components/AvatarUploader.jsx:71`

6. After upload, frontend writes the storage path back into `profiles.avatar_path` (with fallback to `avatar_url` for older schemas).  
   Code: `apps/web/src/app/components/AvatarUploader.jsx:82`, `apps/web/src/app/components/AvatarUploader.jsx:89`

7. Avatar display no longer depends on public URLs; it generates signed URLs from storage paths, and both Account and Navbar reuse the same resolver.  
   Code: `apps/web/src/lib/profile.js:20`  
   Account preview: `apps/web/src/app/components/AvatarUploader.jsx:42`, `apps/web/src/app/components/AvatarUploader.jsx:100`  
   Navbar avatar: `apps/web/src/app/components/Navbar.jsx:81`, `apps/web/src/app/components/Navbar.jsx:89`, `apps/web/src/app/components/Navbar.jsx:234`

8. The Account productivity heatmap now prefers `avatars/{user_id}/progress.json`.  
   Code: `apps/web/src/app/components/ProductivityHeatmap.jsx:62`, `apps/web/src/app/components/ProductivityHeatmap.jsx:124`

9. If `progress.json` does not exist yet, frontend falls back to `productivity_days` and backfills a storage snapshot.  
   Code: `apps/web/src/app/components/ProductivityHeatmap.jsx:73`, `apps/web/src/app/components/ProductivityHeatmap.jsx:127`, `apps/web/src/app/components/ProductivityHeatmap.jsx:129`

10. When a focus pomodoro completes, frontend writes `pomodoro_sessions` and `productivity_days`, then syncs the latest aggregate into `avatars/{user_id}/progress.json`.  
    Code: `apps/web/src/lib/pomodoro/logFocusCompletion.js:63`, `apps/web/src/lib/pomodoro/logFocusCompletion.js:74`, `apps/web/src/lib/pomodoro/logFocusCompletion.js:95`, `apps/web/src/lib/pomodoro/logFocusCompletion.js:103`

## 2) Where the Code Is

### Chat

- Frontend chat page: `apps/web/src/app/dashboard/chat/page.js:18`, `apps/web/src/app/dashboard/chat/page.js:49`, `apps/web/src/app/dashboard/chat/page.js:57`
- Auth token hook: `apps/web/src/app/dashboard/chat/hooks/useAuth.js:4`
- Conversation list / rename / delete: `apps/web/src/app/dashboard/chat/hooks/useThreads.js:6`
- Message streaming / SSE handling: `apps/web/src/app/dashboard/chat/hooks/useChatMessages.js:12`
- Chat routes: `apps/api/app/chat/router.py:30`, `apps/api/app/chat/router.py:49`, `apps/api/app/chat/router.py:59`, `apps/api/app/chat/router.py:68`, `apps/api/app/chat/router.py:90`
- Chat service: `apps/api/app/chat/service.py:31`, `apps/api/app/chat/service.py:161`
- RAG tool and system prompt: `apps/api/app/chat/tools.py:84`, `apps/api/app/chat/tools.py:107`, `apps/api/app/chat/tools.py:134`

### Profile / Account

- Account page: `apps/web/src/app/account/page.js:10`
- Navbar account trigger / display name / avatar refresh: `apps/web/src/app/components/Navbar.jsx:38`
- Avatar upload component: `apps/web/src/app/components/AvatarUploader.jsx:13`
- Productivity heatmap: `apps/web/src/app/components/ProductivityHeatmap.jsx:99`
- Profile helper (signed URL / refresh event): `apps/web/src/lib/profile.js:3`
- Pomodoro completion snapshot sync: `apps/web/src/lib/pomodoro/logFocusCompletion.js:20`, `apps/web/src/lib/pomodoro/logFocusCompletion.js:63`

## 3) What Supabase Is Used For

### Chat

- Supabase Auth JWT: API authentication.  
  Code: `apps/api/app/core/dependencies.py:66`

- Supabase PostgreSQL: `conversations` and `messages` store threads and chat messages.  
  Code: `apps/api/app/chat/router.py:55`, `apps/api/app/chat/service.py:39`, `apps/api/app/chat/service.py:61`, `apps/api/app/chat/service.py:196`

- Supabase Browser Session: frontend reads the access token from the current session.  
  Code: `apps/web/src/app/dashboard/chat/hooks/useAuth.js:10`

### Profile / Account

- Supabase Auth: frontend reads the current logged-in user.  
  Code: `apps/web/src/app/account/page.js:28`, `apps/web/src/app/components/Navbar.jsx:55`, `apps/web/src/app/components/AvatarUploader.jsx:24`, `apps/web/src/app/components/ProductivityHeatmap.jsx:107`

- Supabase PostgreSQL: `profiles` stores display name and avatar path.  
  Code: `apps/web/src/app/account/page.js:41`, `apps/web/src/app/account/page.js:106`, `apps/web/src/app/components/AvatarUploader.jsx:83`, `apps/web/src/app/components/Navbar.jsx:68`

- Supabase PostgreSQL: `pomodoro_sessions` and `productivity_days` store pomodoro sessions and daily aggregates.  
  Code: `apps/web/src/lib/pomodoro/logFocusCompletion.js:74`, `apps/web/src/lib/pomodoro/logFocusCompletion.js:84`

- Supabase Storage: private `avatars` bucket stores avatar files and `progress.json`.  
  Code: `apps/web/src/app/components/AvatarUploader.jsx:71`, `apps/web/src/lib/profile.js:26`, `apps/web/src/app/components/ProductivityHeatmap.jsx:63`, `apps/web/src/lib/pomodoro/logFocusCompletion.js:53`

## 4) What Code Features Are Used

### Chat

- SSE streaming (`token` / `done`).  
  Code: `apps/api/app/chat/service.py:299`, `apps/api/app/chat/service.py:400`

- Frontend token-by-token rendering, followed by done-event replacement of the final message.  
  Code: `apps/web/src/app/dashboard/chat/hooks/useChatMessages.js:114`, `apps/web/src/app/dashboard/chat/hooks/useChatMessages.js:126`

- Automatic conversation creation and message-history assembly.  
  Code: `apps/api/app/chat/service.py:186`, `apps/api/app/chat/service.py:208`

- Together AI structured tool calling plus text-tool-call fallback compatibility.  
  Code: `apps/api/app/chat/service.py:227`, `apps/api/app/chat/service.py:244`, `apps/api/app/chat/tools.py:38`

- Optional RAG retrieval with source propagation.  
  Code: `apps/api/app/chat/tools.py:134`, `apps/api/app/chat/service.py:267`, `apps/api/app/chat/service.py:396`

### Profile / Account

- `profiles.upsert(...)` for saving `full_name`.  
  Code: `apps/web/src/app/account/page.js:106`

- Avatar upload to a private bucket, with storage path written back to `profiles.avatar_path`.  
  Code: `apps/web/src/app/components/AvatarUploader.jsx:71`, `apps/web/src/app/components/AvatarUploader.jsx:83`

- Signed URL generation plus legacy public-URL-to-storage-path compatibility.  
  Code: `apps/web/src/lib/profile.js:8`, `apps/web/src/lib/profile.js:20`

- `studybudd:profile-updated` event for immediate Navbar refresh after name/avatar changes.  
  Code: `apps/web/src/lib/profile.js:4`, `apps/web/src/lib/profile.js:33`, `apps/web/src/app/components/Navbar.jsx:105`

- `progress.json` snapshot write, storage-first read, and database fallback backfill.  
  Code: `apps/web/src/lib/pomodoro/logFocusCompletion.js:20`, `apps/web/src/app/components/ProductivityHeatmap.jsx:62`, `apps/web/src/app/components/ProductivityHeatmap.jsx:73`, `apps/web/src/app/components/ProductivityHeatmap.jsx:85`
