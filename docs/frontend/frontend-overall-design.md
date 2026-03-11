# Overall Webpage Design -- Front-End Architecture

This document covers the big-picture decisions behind the StudyBudd front end: the tech stack, project structure, routing, styling approach, state management, and how everything fits together.

---

## Tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| Framework | Next.js 15 (App Router, Turbopack) | Server components by default, file-based routing, built-in middleware for auth guards, and fast dev builds with Turbopack. |
| UI library | React 19 | Latest React with improved hooks and concurrent features. No component library -- everything is hand-built. |
| Language | JavaScript / JSX | The team is more productive in JS than TypeScript for this project. A `tsconfig.json` exists for editor support but strict mode is off. |
| Styling | Tailwind CSS v4 + scoped inline styles | Tailwind handles 90% of the styling. Feature pages (quizzes, flashcards) use embedded `<style>` blocks for animations and custom properties that would be awkward to express in utility classes. |
| Auth | Supabase Auth (SSR package) | Handles signup, login, OAuth callbacks, and session management. The `@supabase/ssr` package integrates with Next.js middleware for server-side session checks. |
| Icons | Inline SVG + Lucide React | Most icons are hand-written SVG for precise control. Lucide is available for standard icons where custom work is not needed. |
| HTTP | Axios | Used for API calls to the backend (`localhost:8000`). |
| Markdown | react-markdown + remark-gfm + rehype-highlight | Renders markdown in the chat feature with GitHub-flavored tables and syntax-highlighted code blocks. |
| File upload | react-dropzone | Drag-and-drop file upload in the Files page. |

---

## Project structure

StudyBudd is a monorepo with two apps:

```
study-budd/
  apps/
    api/          # Backend (Python / FastAPI)
    web/          # Front end (Next.js)
      src/
        app/
          (auth)/           # Route group -- login and signup pages
          auth/             # OAuth callback handler
          dashboard/        # Authenticated shell (layout + feature pages)
            chat/
            files/
            flashcards/
            quizzes/
          components/       # Shared components (Navbar, Footer, Pomodoro, etc.)
          data/             # Static data files (quiz JSON)
          account/
          contact/
          features/
          pricing/
          quizzes/          # Public-facing quiz page (no auth required)
        lib/
          supabase/         # Browser and server Supabase client factories
          pomodoro/         # Focus session logging utility
      public/               # Static assets (logo SVG)
      tailwind.config.js
      next.config.mjs
  docs/                     # You are here
  tests/                    # Playwright end-to-end tests
```

The `apps/web` build is configured with `output: 'standalone'` in `next.config.mjs` so the production build can run in a Docker container without the full `node_modules` tree.

---

## Routing

Next.js App Router uses the file system for routes. Here is how the pages map out:

### Public pages (no auth required)

| Route | File | Purpose |
|-------|------|---------|
| `/` | `app/page.js` | Marketing home page |
| `/features` | `app/features/page.js` | Feature showcase |
| `/pricing` | `app/pricing/page.js` | Pricing plans |
| `/quizzes` | `app/quizzes/page.js` | Public quiz demo |
| `/contact` | `app/contact/page.js` | Contact form |
| `/login` | `app/(auth)/login/page.js` | Login form |
| `/signup` | `app/(auth)/signup/page.js` | Registration form |

### Protected pages (auth required)

| Route | File | Purpose |
|-------|------|---------|
| `/dashboard` | `app/dashboard/page.jsx` | Dashboard home |
| `/dashboard/files` | `app/dashboard/files/page.js` | Document library |
| `/dashboard/chat` | `app/dashboard/chat/page.js` | AI chat interface |
| `/dashboard/quizzes` | `app/dashboard/quizzes/page.js` | Quiz engine |
| `/dashboard/flashcards` | `app/dashboard/flashcards/page.js` | Flashcard viewer |
| `/account` | `app/account/page.js` | Account settings |

### Route groups

The `(auth)` folder is a Next.js route group -- it organizes login and signup under a shared layout without adding `/auth` to the URL path.

### Auth middleware

`src/middleware.js` runs on every request. It checks for a valid Supabase session:

- If an unauthenticated user hits `/dashboard/*` or `/account`, they get redirected to `/login?redirect=<original_path>`.
- If an authenticated user hits `/login` or `/signup`, they get redirected to `/dashboard`.

This keeps auth enforcement in one place instead of scattering checks across individual pages.

---

## Styling approach

### Tailwind as the default

Almost all layout, spacing, color, and responsive behavior is expressed through Tailwind utility classes. The config (`tailwind.config.js`) extends the default theme with custom keyframes for a typing animation used on the home page.

### When Tailwind was not enough

The quiz and flashcard pages needed:

- Multi-step CSS keyframe animations (shake, slideUp, popIn, optIn) with specific timing curves.
- CSS custom properties (`--accent`) that change dynamically based on deck selection or quiz state.
- `color-mix()` for generating lighter/darker variants of accent colors on the fly.
- 3D transforms with `perspective` and `backface-visibility`.

For these cases, embedded `<style>` blocks inside the component made more sense than fighting Tailwind's utility model. The styles are scoped to the page and co-located with the component that uses them.

### Global styles

`globals.css` imports Tailwind's base, components, and utilities layers. It also defines:

- CSS custom properties for light/dark mode (though dark mode is only used on the quiz page currently).
- Custom button classes (`.btn`, `.btn-liquid`, `.btn-style501`) for the marketing pages.
- Navbar-specific classes (`.liquid-header`, `.nav-pill`, `.account-trigger`, `.menu-panel`).
- A typing animation for the home page hero text.

### Design tokens

The app uses a consistent set of colors:

| Role | Value | Where |
|------|-------|-------|
| Primary | Indigo (#6366f1, #4f46e5) | Buttons, active states, focus mode |
| Secondary | Slate grays | Text, borders, backgrounds |
| Success | Emerald (#22c55e, #10b981) | Correct answers, short break, heatmap |
| Danger | Red (#ef4444) | Wrong answers, sign out, delete |
| Info | Blue (#3b82f6, #0ea5e9) | Links, long break, progress bars |

Corner radii follow Tailwind's scale: `rounded-2xl` (16px) for cards, `rounded-xl` (12px) for smaller panels, `rounded-lg` (8px) for buttons.

---

## State management

There is no Redux or Zustand in this project. State is handled through three mechanisms, chosen based on scope.

### React Context (global, cross-page state)

Two contexts are mounted at the root layout level:

1. **PomodoroProvider** -- timer state, mode, durations, play/pause/reset controls. Consumed by the sidebar card, the floating widget, and the quiz page's timer integration.
2. **NotificationsContext** -- notification list, unread count, mark-as-read, and clear-all. Consumed by the navbar's bell icon.

These were kept as plain Context + useState rather than pulling in a state library because the state shapes are small and the update patterns are simple (no complex derived state, no middleware).

### localStorage (client-side persistence)

The Pomodoro timer persists its full state to localStorage so sessions survive page refreshes and browser restarts. The key is `studybudd_pomodoro_v1`. A hydration guard prevents SSR mismatches.

### Component-local state

Everything else -- which tab is active, whether a modal is open, the current card index, quiz answers -- lives in `useState` hooks local to the component that owns the interaction. This keeps things simple and avoids the overhead of lifting state that does not need to be shared.

---

## Component hierarchy

```
Root Layout (layout.js)
  NotificationsProvider
    PomodoroProvider
      Navbar
        NotificationBell
        User dropdown menu
      {children}  -- routed pages:
        Marketing pages (home, features, pricing, contact)
        Auth pages (login, signup)
        Dashboard Layout (dashboard/layout.jsx)
          Sidebar
            Nav links
            PomodoroSidebarCard
          Content area
            Dashboard Home
            Files page
            Chat page
            Quizzes page
            Flashcards page
        Account page
      Footer
```

The root layout handles the providers, navbar, and footer. The dashboard layout adds the sidebar. Individual pages fill the content area.

---

## Authentication flow

1. User visits `/login` or `/signup`.
2. Credentials go to Supabase Auth (email/password or OAuth).
3. On success, Supabase sets a session cookie. The `/auth/callback` route handles OAuth redirects.
4. Middleware reads the session cookie on subsequent requests and allows or redirects accordingly.
5. The navbar subscribes to `onAuthStateChange` to update the UI in real time when the session changes.
6. Supabase client factories (`lib/supabase/client.js` and `lib/supabase/server.js`) create browser-side and server-side clients respectively, ensuring cookies are handled correctly in both environments.

---

## Fonts

| Font | Usage | Source |
|------|-------|--------|
| System default (Tailwind sans) | General UI text | Built-in |
| DM Serif Display | Flashcard question text | Google Fonts |
| DM Sans | Flashcard body/UI text | Google Fonts |
| Sora | Quiz page body text | Google Fonts |
| JetBrains Mono | Timer digits, code blocks | Google Fonts |

Fonts are loaded via `<link>` tags or `@import` in component-scoped style blocks. They are not configured in `next/font` -- this is a potential optimization for later to eliminate FOUT (flash of unstyled text).

---

## Responsive strategy

The app follows a mobile-first approach using Tailwind breakpoints:

- **Mobile (default)**: Single-column layouts, hidden sidebar, stacked elements.
- **`sm` (640px)**: Minor spacing adjustments.
- **`md` (768px)**: Some grids move to 2 columns.
- **`lg` (1024px)**: Dashboard sidebar appears, grids expand to 3+ columns.

Font sizes use `clamp()` on feature pages (quizzes, flashcards) for fluid scaling between breakpoints without needing extra media queries.

---

## What is not built yet

A few things are stubbed out in the UI but not wired to the backend:

- **Chat**: The page exists with a full message UI, SSE streaming setup, and thread management, but it talks to `localhost:8000/api` which needs the backend running.
- **Files**: Upload, search, filter, and share UI is complete. It also calls `localhost:8000/api` for document management and RAG queries.
- **Flashcard data**: Currently uses hardcoded demo decks. No API integration for user-created decks yet.
- **Notifications**: The context and bell UI work, but nothing pushes real notifications into the context yet.
- **Heatmap**: The component queries Supabase directly; it will show data once users have completed Pomodoro sessions that get logged.

---

## References

- Next.js 15 App Router docs: https://nextjs.org/docs/app
- Next.js Middleware: https://nextjs.org/docs/app/building-your-application/routing/middleware
- React 19: https://react.dev/blog/2024/12/05/react-19
- Tailwind CSS v4: https://tailwindcss.com/docs
- Supabase SSR auth for Next.js: https://supabase.com/docs/guides/auth/server-side/nextjs
- Lucide icon library: https://lucide.dev/
- react-markdown: https://github.com/remarkjs/react-markdown
- react-dropzone: https://react-dropzone.js.org/
- clamp() for responsive type: https://developer.mozilla.org/en-US/docs/Web/CSS/clamp
