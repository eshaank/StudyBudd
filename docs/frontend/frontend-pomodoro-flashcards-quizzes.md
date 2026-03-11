# Pomodoro Timer, Flashcards & Quizzes -- Front-End Design

This document walks through the design thinking, component breakdown, and technical choices behind the three core study features in StudyBudd: the Pomodoro timer system, the Flashcard viewer, and the Quiz engine.

---

## Pomodoro Timer

### Why we built it the way we did

The Pomodoro technique is dead simple on paper -- work for 25 minutes, take a 5-minute break, repeat. But making it feel good in a web app brings up a few real questions:

- Where does the timer live? It needs to be visible whether the user is on the quizzes page, the flashcards page, or just sitting on the dashboard.
- What happens if someone refreshes the page mid-session? The countdown should pick up where it left off, not restart.
- How do we avoid the timer drifting? A naive `setInterval` that decrements a counter will lose accuracy over time because JS timers are not precise.

We solved all three.

### Components

| File | Role |
|------|------|
| `components/PomodorTimer.jsx` | Full-size timer panel with mode tabs, start/pause/reset, and editable durations |
| `components/PomodoroSidebarCard.jsx` | Compact card that sits in the dashboard sidebar with an SVG progress ring |
| `components/PomodoroWidget.jsx` | Floating bubble (bottom-right corner) that expands into the full timer |
| `components/PomodoroProvider.jsx` | React Context wrapper so any component in the tree can read/control the timer |
| `components/pomodoroStore.js` | Custom hook that owns all timer state, persistence, and countdown logic |
| `lib/pomodoro/logFocusCompletion.js` | Logs completed focus sessions to Supabase for the productivity heatmap |

### How the timer actually works

The store (`pomodoroStore.js`) does not count down by decrementing a number every second. Instead, when the user hits Start we record a `targetEndMs` -- the wall-clock time when the session should end. A `setInterval` fires every 250ms and computes `secondsLeft = Math.ceil((targetEndMs - Date.now()) / 1000)`. This approach means the timer stays accurate even if the browser throttles the interval (which it will in background tabs).

All state -- durations, mode, cycle count, and the target end timestamp -- gets written to `localStorage` under the key `studybudd_pomodoro_v1`. On mount, the store reads that key back and rehydrates. If there is a `targetEndMs` in the future, the timer resumes automatically. A `hydrated` flag prevents rendering stale default values before the localStorage read finishes, which avoids the classic Next.js SSR/client mismatch warning.

### Modes and auto-advance

Three modes: Focus (default 25 min), Short Break (5 min), Long Break (15 min). All durations are configurable within bounds (focus: 1-180 min, short: 1-60, long: 1-90). When a mode's timer hits zero the store automatically advances:

- Focus finishes -> increment `cycleCount`, switch to Short Break (or Long Break every N sessions, configurable 2-10).
- Any break finishes -> switch back to Focus.

Each focus completion also calls `logFocusCompletion()`, which inserts a row into `pomodoro_sessions` and upserts the daily aggregate into `productivity_days` so the heatmap stays current.

### Visual design

The sidebar card uses an SVG circle (radius 22, circumference ~138px) with `stroke-dashoffset` animated against the remaining fraction. The color changes per mode: indigo for focus, emerald for short break, blue for long break. The floating widget is a small pill that expands into the full timer panel, positioned fixed at `bottom-right` with z-index 50 so it floats above page content.

### References

- Pomodoro Technique overview: https://en.wikipedia.org/wiki/Pomodoro_Technique
- React Context API: https://react.dev/reference/react/createContext
- Why wall-clock timers beat setInterval counting: https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval#delay_restrictions
- SVG stroke-dashoffset for circular progress: https://css-tricks.com/building-progress-ring-quickly/

---

## Flashcards

### Design goals

We wanted the flashcard experience to feel tactile, like flipping a physical card. That meant a real 3D flip animation, not just swapping content. We also wanted keyboard navigation so power users could blaze through a deck without touching the mouse.

### Component structure

Everything lives in a single page component: `dashboard/flashcards/page.js`. It is a client component (`"use client"`) because it relies heavily on state and keyboard event listeners.

### The flip animation

The card container has `perspective: 1800px` set on the wrapper. Inside, the card div transitions `rotateY(0deg)` to `rotateY(180deg)` over 550ms with a cubic-bezier easing curve. Both the front and back faces use `backface-visibility: hidden` so only one side is visible at a time. The back face has `rotateY(180deg)` applied by default so it faces away until the flip brings it forward.

An `isAnimating` flag blocks interaction during the 550ms transition so rapid clicks do not break the visual state.

### Deck system

Three demo decks are hardcoded (PHIL-100, CSE-130, CSE-114A), each with a unique accent color. The accent color is set as a CSS custom property `--accent` and propagated through the card, badges, progress bar, and navigation buttons using `color-mix(in srgb, ...)` for lighter/darker variants. Switching decks resets the card index and flip state.

### Navigation

- Arrow keys (left/right) move between cards and auto-unflip.
- Spacebar flips the current card.
- Dot indicators at the bottom show position; the active dot stretches to 20px wide.
- A progress bar fills proportionally with a smooth 400ms transition.

### Tab placeholders

Four tabs appear at the top: Flashcards, Learn, Test, Match. Only Flashcards is functional right now. The others render placeholder UI. This was a deliberate choice -- ship the core experience first, add spaced-repetition modes later when the backend supports tracking review intervals.

### Typography

The card fronts use DM Serif Display for a slightly formal, textbook look. Card backs and UI chrome use DM Sans. Both are loaded from Google Fonts.

### References

- CSS 3D transforms and backface-visibility: https://developer.mozilla.org/en-US/docs/Web/CSS/backface-visibility
- CSS perspective property: https://developer.mozilla.org/en-US/docs/Web/CSS/perspective
- color-mix() for dynamic theming: https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix
- DM Serif Display font: https://fonts.google.com/specimen/DM+Serif+Display
- DM Sans font: https://fonts.google.com/specimen/DM+Sans

---

## Quizzes

### What drove the design

The quiz page needed to do two things well: make answering questions feel snappy with clear right/wrong feedback, and integrate with the Pomodoro timer so students can do timed study sessions. We went with a dark theme here specifically to reduce eye strain during longer quiz sessions -- it is the only page in the app that breaks from the light palette.

### Component structure

Like flashcards, the quiz is a single page component: `dashboard/quizzes/page.js`. It manages two views internally -- the active quiz and the results breakdown -- toggled by a `view` state variable.

### Question data

Questions come from `data/dsaQuiz.json`, a static JSON file with 10 multiple-choice DSA questions. Each question object has an `id`, `prompt`, `options` array, and `correctIndex`. This keeps the quiz data separate from the rendering logic and makes it straightforward to swap in different question sets later.

### Answer flow

1. User sees a question card with options labeled A through F (depending on option count).
2. Options animate in with staggered delays (50ms apart) for a cascading entrance effect.
3. User clicks an option. The component locks all options, highlights the correct one green and (if wrong) the selected one red.
4. A feedback panel slides up below the card showing "Correct!" or "Not quite" with an explanation.
5. The explanation comes from an `EXPLANATIONS` map keyed by question ID. It supports different text for correct vs. wrong answers, and even different text per wrong option. If no custom explanation exists, a generic fallback is used.
6. A "Next Question" button advances to the next card with a fresh slideUp animation.

### Animations

- Wrong answer triggers a shake animation (0.55s, oscillating horizontally from 8px down to 2px).
- New question cards use a slideUp keyframe (translateY from 30px to 0 with scale 0.97 to 1).
- The feedback verdict icon uses a popIn animation with elastic easing.
- The progress bar width transitions smoothly over 550ms.

### Results view

After the last question, the user sees a results screen with:

- A circular score gauge (SVG ring, 128px) that fills proportionally and changes color: green above 80%, orange 50-79%, red below 50%.
- A label like "Excellent!" or "Keep studying" based on the score bracket.
- A per-question breakdown showing the user's answer, the correct answer, and the explanation.

A "Retry Quiz" button resets all state.

### Pomodoro integration

The quiz page pulls in the Pomodoro context and renders a small timer display in the top-right corner. There is a "Focus 25m" button that starts a pomodoro session directly from the quiz. The component watches `cycleCount` and auto-advances to the results view when a focus cycle completes, so students can use the timer as a built-in test clock.

### Color palette

The dark theme uses `#0a0c12` as the base background with radial gradient glows in blue (`#3b82f6`) and purple (`#8b5cf6`). Text is `#f1f5f9`. Correct/wrong states use `#22c55e` and `#ef4444`. The fonts are Sora for body text and JetBrains Mono for the timer digits.

### Responsive handling

A single breakpoint at 500px adjusts padding and makes the timer section stack vertically on narrow screens. The card and options scale down gracefully since font sizes use `clamp()`.

### References

- Sora font: https://fonts.google.com/specimen/Sora
- JetBrains Mono font: https://fonts.google.com/specimen/JetBrains+Mono
- CSS clamp() for fluid typography: https://developer.mozilla.org/en-US/docs/Web/CSS/clamp
- CSS keyframe animations: https://developer.mozilla.org/en-US/docs/Web/CSS/@keyframes
- SVG circle progress technique: https://css-tricks.com/building-progress-ring-quickly/
