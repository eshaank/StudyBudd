
# Dashboard -- Front-End Design

This document covers the dashboard shell, sidebar navigation, home page, and the supporting components that tie the authenticated experience together.

---

## Layout architecture

The dashboard uses a two-column grid layout defined in `dashboard/layout.jsx`. The left column is a fixed 320px sidebar; the right column stretches to fill the remaining space. On screens narrower than the `lg` breakpoint the sidebar hides entirely and the content goes full-width.

```
+---------------------+------------------------------------------+
|  Sidebar (320px)    |  Content area (flex)                     |
|                     |                                          |
|  Nav items          |  Rendered by child page.jsx              |
|  Pomodoro card      |                                          |
|                     |                                          |
+---------------------+------------------------------------------+
```

The layout is wrapped in `<PomodoroProvider>` so every page inside the dashboard -- quizzes, flashcards, files, chat -- can access the timer state without prop drilling.

### Background treatment

Three absolutely positioned blurred circles (indigo, blue, purple) sit behind the content at varying positions. They create a subtle gradient glow effect without needing a complex CSS gradient. The main background gradient runs `from-indigo-50 via-blue-50 to-slate-100`, keeping things light and neutral.

---

## Sidebar

The sidebar is a sticky column (`top-6`) with two sections: navigation links and the Pomodoro card.

### Navigation items

Four links, each with an icon, label, and subtitle:

| Label | Icon | Route | Subtitle |
|-------|------|-------|----------|
| Files | folder icon | `/dashboard/files` | Your study library |
| Chat | message icon | `/dashboard/chat` | Ask & revisit answers |
| Quizzes | brain icon | `/dashboard/quizzes` | Practice by topic |
| Flashcards | cards icon | `/dashboard/flashcards` | Spaced repetition |

The active link is determined by checking `pathname?.startsWith(href)` against the current route. Active items get an indigo background with white text; inactive ones are semi-transparent with a hover state.

### Pomodoro sidebar card

Below the nav links sits the `PomodoroSidebarCard` component -- a compact timer widget with an SVG progress ring, mode switcher, and expandable settings. It is conditionally rendered behind a `mounted` state check to avoid SSR hydration mismatches (the timer reads from localStorage on mount).

---

## Dashboard home page

`dashboard/page.jsx` is the landing page users see after logging in. It is broken into four sections.

### Greeting header

A time-based greeting ("Good morning", "Good afternoon", "Good evening") paired with the user's name extracted from their email prefix. Below that, a short line about their last session (currently placeholder text). The greeting is wrapped in `useMemo` keyed on the hour so it does not recompute on every render.

### Continue Where You Left Off

A responsive grid (1 column on mobile, 3 on desktop) of cards representing recent activity. Each card has an icon, title, and subtitle linking to a feature page. Examples: "PHIL-100 Notes" linking to Files, "Last conversation" linking to Chat, "Flashcards -- 12 cards due" linking to Flashcards. The data is currently mocked -- once the backend tracks user activity, these cards would pull from real session history.

### Your Tools

A 5-card grid showing all available study tools (Pomodoro, Files, Chat, Quizzes, Flashcards). Each card is rendered by a `ToolCard` sub-component that accepts `title`, `desc`, `href`, and `pill` props. The pill is a small badge indicating availability: "Free", "Org", or "Preview". Cards link directly to their respective pages.

### Upgrade section

A gradient-background banner promoting premium features ("Keep chat history, unlimited focus") with two buttons: Upgrade and Continue Free. This is a static CTA block for now.

---

## Navbar

`components/Navbar.jsx` is the top-level sticky navigation bar shared across the entire app (not just the dashboard).

### Logged-out state

Shows the StudyBudd logo, desktop nav links (Features, Pricing, Quizzes), and Login / Sign Up buttons. The sign-up button uses a primary pill style to draw attention.

### Logged-in state

Desktop nav links are hidden (the dashboard sidebar handles navigation). Instead, the navbar shows:

- A notification bell (see below).
- A user avatar trigger -- a circle with the first letter of the user's email. Clicking it opens a dropdown menu.

### User dropdown menu

The dropdown is absolutely positioned and closes on:
- Clicking outside (tracked via a `menuRef` and document event listener).
- Pressing Escape.
- Navigating to a new route (watched via `usePathname`).

Menu items: Dashboard, Files, Chat, Quizzes, Account, and Sign Out. Sign Out is styled in red to signal it is a destructive action.

### Auth state management

The navbar subscribes to Supabase's `onAuthStateChange` listener. When the auth state changes (login, logout, token refresh), the component updates its `user` state and re-renders the appropriate UI. This subscription is set up in a `useEffect` and cleaned up on unmount.

### Styling

The header uses a glass-morphism look: a semi-transparent background with a subtle border and rounded corners. Custom CSS classes (`.liquid-header`, `.nav-pill`, `.account-trigger`, `.menu-panel`) are defined in `globals.css`.

---

## Notification bell

`components/NotificationBell.jsx` renders a bell icon in the navbar with an unread badge.

### How it works

- The bell shows a red badge with the unread count (capped at "9+").
- Clicking opens a dropdown panel (width 320px, max-height 288px, scrollable).
- Each notification shows an avatar badge, message text, and relative time ("2m ago", "1h ago").
- Unread notifications have a light indigo background highlight.
- Opening the dropdown auto-marks everything as read.
- A "Clear all" button wipes the list.

### State

Notifications are managed by `NotificationsContext`, which provides `notifications`, `unreadCount`, `addNotification`, `markAllRead`, and `clearAll`. The context is mounted at the root layout level so any component in the app can push a notification (for example, the files page could notify when an upload finishes).

---

## Productivity heatmap

`components/ProductivityHeatmap.jsx` renders a GitHub-style contribution grid showing focus time over the past 52 weeks.

### Data

It queries the `productivity_days` Supabase table for the authenticated user, pulling `day` and `focus_minutes` columns. The data populates a 53-column by 7-row grid (one cell per day).

### Color scale

Five intensity levels mapped from focus minutes:

| Level | Color | Meaning |
|-------|-------|---------|
| 0 | white/10 | No activity |
| 1 | dark emerald | Light activity |
| 2 | mid emerald | Moderate |
| 3 | bright emerald | Good |
| 4 | vivid emerald | Heavy |

The component also calculates a streak count (consecutive days with any focus activity).

### Design choice

We went with emerald greens to match the short-break accent color from the Pomodoro timer, tying the visual language together. The dark background (`white/5`) makes the heatmap feel like a standalone data card rather than blending into the light dashboard background.

---

## References

- Next.js App Router layouts: https://nextjs.org/docs/app/building-your-application/routing/layouts-and-templates
- React Context for global state: https://react.dev/reference/react/createContext
- Supabase Auth helpers for Next.js: https://supabase.com/docs/guides/auth/server-side/nextjs
- Tailwind CSS grid layout: https://tailwindcss.com/docs/grid-template-columns
- Glass-morphism technique: https://css-tricks.com/glassmorphism-css-effect/
- GitHub contribution graph (heatmap inspiration): https://docs.github.com/en/account-and-profile/setting-up-and-managing-your-github-profile/managing-contribution-settings-on-your-profile
