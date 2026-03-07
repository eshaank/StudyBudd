export const DEMO_DECKS = [
  { id: "phil-100", title: "PHIL-100", subtitle: "Free Will & Determinism", total: 42, color: "#6366f1" },
  { id: "cse-130", title: "CSE-130", subtitle: "Virtual Memory & AMAT", total: 55, color: "#0ea5e9" },
  { id: "cse-114a", title: "CSE-114A", subtitle: "Haskell & Recursion", total: 30, color: "#10b981" },
];

export const DEMO_CARDS = [
  {
    id: "c1",
    deckId: "phil-100",
    front: "Compatibilism (Ayer): What makes an action 'free'?",
    back: "An action is free if it flows from the agent's desires/intentions without external constraint (even if causally determined).",
  },
  {
    id: "c2",
    deckId: "phil-100",
    front: "Determinism vs Fatalism (one sentence each)",
    back: "Determinism: every event has sufficient prior causes. Fatalism: outcomes happen no matter what you do.",
  },
  {
    id: "c3",
    deckId: "cse-130",
    front: "What does the TLB speed up?",
    back: "Virtual-to-physical address translation by caching recent page table entries.",
  },
];

export const TABS = [
  { key: "flashcards", label: "Flashcards", icon: "\u2B21" },
  { key: "learn", label: "Learn", icon: "\u25C8" },
  { key: "test", label: "Test", icon: "\u25CE" },
  { key: "match", label: "Match", icon: "\u2B19" },
];
