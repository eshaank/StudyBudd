# Frontend Refactoring Plan — Sprint 4 UI Cleanup

## Overview

This document describes the refactoring performed on the `apps/web/src/` frontend codebase to reduce file sizes, eliminate duplication, and establish consistent architectural patterns across all features.

---

## Problem Statement

Several page components had grown well beyond target line counts:

| Target | Category | Max Lines |
|--------|----------|-----------|
| Page components (route files) | `app/**/page.js` | 50–200 |
| Feature components | Reusable within a feature | 100–300 |
| Shared components | Used across features | 20–150 |

### Files that violated these targets

| File | Lines | Issue |
|------|-------|-------|
| `app/quizzes/page.js` | 562 | 3x over target, exact duplicate of dashboard version |
| `app/dashboard/quizzes/page.js` | 562 | Exact duplicate (DRY violation) |
| `app/dashboard/flashcards/page.js` | 476 | 2.5x over target, all logic inline |
| `app/(auth)/login/page.js` | 329 | Over target, shared code with signup, ESLint warning |
| `app/(auth)/signup/page.js` | 356 | Over target, shared code with login |
| `components/PomodoroSidebarCard.jsx` | 272 | 1.8x over shared component target |

---

## Architectural Decisions

### 1. Feature-local vs shared modules

**Decision:** Quiz code lives in `src/features/quiz/` (shared module) while flashcards stay in `app/dashboard/flashcards/` (feature-local).

**Rationale:**
- Quiz is consumed by **two different routes** (`/quizzes` and `/dashboard/quizzes`) — making it a shared feature module eliminates the duplication entirely.
- Flashcards is only used by one route (`/dashboard/flashcards`) — keeping it feature-local avoids unnecessary indirection.

This follows the pattern established in the prior refactoring sprint where `lib/api.js`, `lib/format.js`, and `constants/files.js` became shared, while `dashboard/chat/` and `dashboard/files/` kept feature-local hooks and components.

### 2. Directory structure convention

Every refactored feature follows this structure:

```
feature/
  hooks/        — Custom React hooks (state logic, side effects)
  components/   — Presentational and container components
  constants/    — Static data, configuration, maps
```

This was already established by the chat and files refactoring. We extended it to quizzes, flashcards, and auth.

### 3. Props over imports for data

**Decision:** `QuizPage` receives `quiz` as a prop rather than importing the JSON directly.

**Rationale:** This future-proofs the component for multiple quiz datasets. Each route file imports its own quiz data and passes it down:

```js
// app/quizzes/page.js
import QUIZ from "../data/dsaQuiz.json";
import QuizPage from "../../features/quiz/QuizPage";
export default function QuizzesRoute() {
  return <QuizPage quiz={QUIZ} />;
}
```

If a new quiz is added later (e.g., `algorithmsQuiz.json`), only a new route file is needed — zero changes to QuizPage.

### 4. Shared auth layout via composition

**Decision:** Auth pages use a composition pattern (`AuthLayout` + `AuthFeaturePanel` + `GoogleAuthButton`) rather than a single monolithic component with config props.

**Rationale:**
- Login and signup have different form fields (login has no confirm password, signup has no "forgot password" link).
- Trying to unify the forms into one component would create complex conditional logic.
- Instead, we share the **chrome** (background blobs, grid layout, feature panel, Google button) and let each page own its form.

### 5. ESLint fix for `redirectTo` dependency

**Problem:** `login/page.js` had a missing `redirectTo` in the `useEffect` dependency array, causing an ESLint warning.

**Fix:** The `useAuthSession` hook properly includes `redirectTo` in its dependency array:

```js
useEffect(() => {
  // ... session check logic using redirectTo ...
}, [router, redirectTo]); // ← both deps included
```

This is safe because `redirectTo` is derived from `searchParams.get("redirect")` which is stable for the lifetime of the page.

### 6. Sub-component extraction for PomodoroSidebarCard

**Decision:** Extract `ModeBtn`, `TimeInput`, and `PomodoroSettings` into `components/pomodoro/`.

**Rationale:**
- `ModeBtn` and `TimeInput` are pure presentational components — zero logic, just styling.
- `PomodoroSettings` is the entire expandable settings panel — it has a clear boundary (everything below the divider line).
- The main `PomodoroSidebarCard` keeps the always-visible compact row and the expand/collapse toggle.

---

## Phase-by-Phase Breakdown

### Phase 1: Quizzes (highest impact)

**Before:** Two identical 562-line files.

**After:**

```
src/features/quiz/
  QuizPage.jsx              (82 lines)  — orchestrator: header, timer, view switching
  hooks/
    useQuizState.js          (78 lines)  — all quiz state: answers, navigation, score, pomodoro
    useShake.js              (14 lines)  — shake animation on wrong answer
  components/
    QuizView.jsx             (68 lines)  — question card + options rendering
    ResultsView.jsx          (62 lines)  — score gauge + per-question review
    FeedbackPanel.jsx        (91 lines)  — correct/wrong explanation panel
    ProgressRing.jsx         (14 lines)  — SVG circular progress
    QuizStyles.jsx           (96 lines)  — all CSS-in-JS styles
  constants/
    explanations.js          (36 lines)  — EXPLANATIONS map + getExplanation()

app/quizzes/page.js           (7 lines)  — thin wrapper
app/dashboard/quizzes/page.js  (7 lines)  — thin wrapper
```

**Total: ~555 lines of shared code, 14 lines of route code**
**Before: 1,124 lines (562 x 2 duplicated)**
**Reduction: ~50% fewer lines, 100% DRY**

#### Data flow

```
Route page.js
  └── imports dsaQuiz.json
  └── renders <QuizPage quiz={QUIZ}>
        └── useQuizState(quiz) — all state management
        └── <QuizStyles /> — CSS
        └── <QuizView /> or <ResultsView /> based on `view` state
              └── <FeedbackPanel /> — shown after answering
              └── <ProgressRing /> — used in ScoreGauge
```

### Phase 2: Flashcards

**Before:** 476 lines, everything inline.

**After:**

```
app/dashboard/flashcards/
  page.js                    (97 lines)  — orchestrator: header, tabs, footer
  hooks/
    useFlashcardNav.js       (67 lines)  — deck selection, card index, flip, keyboard shortcuts
  components/
    FlashcardViewer.jsx      (120 lines) — 3D flip card + top bar
    DeckSwitcher.jsx         (27 lines)  — deck pill buttons
    CardNavigation.jsx       (62 lines)  — prev/next + progress bar + dots
    FlashcardStyles.jsx      (68 lines)  — CSS-in-JS for fc-* classes
  constants/
    flashcards.js            (33 lines)  — DEMO_DECKS, DEMO_CARDS, TABS
```

**Reduction: 476 → 97 lines in page.js (80% reduction)**

#### Key extraction: `useFlashcardNav`

This hook encapsulates:
- Deck selection state (`activeDeckId`)
- Card navigation (`index`, `prev`, `next`, `goToCard`)
- Flip animation (`isFlipped`, `isAnimating`, `flip`)
- Keyboard shortcuts (Space to flip, arrow keys to navigate)
- Derived values (`deck`, `cards`, `current`, `progressPct`, `accentColor`)

The page component only handles layout and passes props to child components.

### Phase 3: Auth Pages (login + signup)

**Before:** 329 + 356 = 685 lines with significant duplication.

**After:**

```
app/(auth)/
  hooks/
    useAuthSession.js        (33 lines)  — session check + redirect
  components/
    AuthLayout.jsx           (22 lines)  — background blobs + grid + slots
    AuthFeaturePanel.jsx     (27 lines)  — gradient panel (configurable via props)
    GoogleAuthButton.jsx     (22 lines)  — divider + Google sign-in button
  login/page.js              (135 lines) — login form + shared components
  signup/page.js             (148 lines) — signup form + shared components
```

**Reduction: 685 → 387 total lines (44% reduction)**

#### What's shared vs unique

| Shared | Login-only | Signup-only |
|--------|-----------|-------------|
| Background blobs | "Forgot password?" link | Confirm password field |
| Grid layout | `useSearchParams` for redirect | Different submit handler (signUp vs signIn) |
| Feature panel (configurable) | `<Suspense>` wrapper | — |
| Google OAuth button | — | — |
| Session check hook | — | — |

#### ESLint fix

The old code had:
```js
useEffect(() => {
  // uses redirectTo
}, [router]); // ← missing redirectTo
```

The new `useAuthSession(redirectTo)` hook includes both deps:
```js
useEffect(() => {
  // uses redirectTo
}, [router, redirectTo]); // ← fixed
```

### Phase 4: PomodoroSidebarCard

**Before:** 272 lines with inline sub-components.

**After:**

```
components/
  PomodoroSidebarCard.jsx    (87 lines)  — compact row + expand toggle
  pomodoro/
    ModeBtn.jsx              (14 lines)  — focus/short/long button
    TimeInput.jsx            (16 lines)  — number input with label
    PomodoroSettings.jsx     (63 lines)  — expandable settings panel
```

**Reduction: 272 → 87 lines in main file (68% reduction)**

---

## What Was NOT Refactored (and why)

| File | Lines | Reason |
|------|-------|--------|
| `components/Navbar.jsx` | 255 | Single responsibility, borderline — not worth the churn |
| `dashboard/page.jsx` | 252 | Demo data will be replaced by real API data soon |
| `features/page.js` | 251 | Marketing page, rarely changes, self-contained |
| `components/DocumentUpload.jsx` | 234 | Within feature component range (100–300) |
| `components/PomodoroTimer.jsx` | 224 | Within feature component range |
| `account/page.js` | 203 | Only 3 lines over target |

---

## Verification Checklist

After all phases:

1. **Build:** `cd apps/web && npx next build` — must compile with 0 errors
2. **Lint:** `npx next lint` — must pass, login ESLint warning must be gone
3. **Routes to verify manually:**
   - `/quizzes` — quiz flow, scoring, results, retry
   - `/dashboard/quizzes` — identical behavior to above
   - `/dashboard/flashcards` — deck switching, card flip, keyboard shortcuts
   - `/login` — form validation, Google OAuth, redirect
   - `/signup` — form validation, confirm password, Google OAuth
   - Any dashboard page — sidebar Pomodoro card, expand/collapse, timer controls

---

## File Impact Summary

### New files created (20 files)

```
src/features/quiz/
  QuizPage.jsx
  hooks/useQuizState.js
  hooks/useShake.js
  components/QuizView.jsx
  components/ResultsView.jsx
  components/FeedbackPanel.jsx
  components/ProgressRing.jsx
  components/QuizStyles.jsx
  constants/explanations.js

app/dashboard/flashcards/
  hooks/useFlashcardNav.js
  components/FlashcardViewer.jsx
  components/DeckSwitcher.jsx
  components/CardNavigation.jsx
  components/FlashcardStyles.jsx
  constants/flashcards.js

app/(auth)/
  hooks/useAuthSession.js
  components/AuthLayout.jsx
  components/AuthFeaturePanel.jsx
  components/GoogleAuthButton.jsx

app/components/pomodoro/
  ModeBtn.jsx
  TimeInput.jsx
  PomodoroSettings.jsx
```

### Files modified (6 files)

```
app/quizzes/page.js                   562 → 7 lines
app/dashboard/quizzes/page.js         562 → 7 lines
app/dashboard/flashcards/page.js      476 → 97 lines
app/(auth)/login/page.js              329 → 135 lines
app/(auth)/signup/page.js             356 → 148 lines
app/components/PomodoroSidebarCard.jsx 272 → 87 lines
```

### Total line reduction

| Metric | Before | After |
|--------|--------|-------|
| Total lines in modified files | 2,557 | 481 |
| Shared/extracted code | 0 | ~930 |
| **Net total** | **2,557** | **~1,411** |
| **Reduction** | — | **~45%** |

The net line count decreased while gaining full DRY compliance, better separation of concerns, and individually testable units.
