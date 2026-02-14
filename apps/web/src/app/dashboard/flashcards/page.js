"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const DEMO_DECKS = [
  { id: "phil-100", title: "PHIL-100", subtitle: "Free Will & Determinism", total: 42 },
  { id: "cse-130", title: "CSE-130", subtitle: "Virtual Memory & AMAT", total: 55 },
  { id: "cse-114a", title: "CSE-114A", subtitle: "Haskell & Recursion", total: 30 },
];

const DEMO_CARDS = [
  {
    id: "c1",
    deckId: "phil-100",
    front: "Compatibilism (Ayer): What makes an action 'free'?",
    back: "An action is free if it flows from the agent’s desires/intentions without external constraint (even if causally determined).",
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

const TABS = [
  { key: "flashcards", label: "Flashcards" },
  { key: "learn", label: "Learn" },
  { key: "test", label: "Test" },
  { key: "match", label: "Match" },
];

export default function FlashcardsPage() {
  const [activeDeckId, setActiveDeckId] = useState(DEMO_DECKS[0].id);
  const [tab, setTab] = useState("flashcards");

  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const deck = useMemo(
    () => DEMO_DECKS.find((d) => d.id === activeDeckId),
    [activeDeckId]
  );

  const cards = useMemo(
    () => DEMO_CARDS.filter((c) => c.deckId === activeDeckId),
    [activeDeckId]
  );

  const current = useMemo(() => {
    if (!cards.length) return null;
    return cards[Math.min(index, cards.length - 1)];
  }, [cards, index]);

  // Reset when switching deck
  useEffect(() => {
    setIndex(0);
    setIsFlipped(false);
  }, [activeDeckId]);

  function flip() {
    setIsFlipped((v) => !v);
  }
  function prev() {
    setIsFlipped(false);
    setIndex((i) => Math.max(0, i - 1));
  }
  function next() {
    setIsFlipped(false);
    setIndex((i) => Math.min(cards.length - 1, i + 1));
  }

  // Keyboard controls: Space flip, arrows nav
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        flip();
      } else if (e.key === "ArrowLeft") {
        prev();
      } else if (e.key === "ArrowRight") {
        next();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.length]);

  const progressText = cards.length ? `${index + 1} / ${cards.length}` : "0 / 0";
  const disabledPrev = index <= 0;
  const disabledNext = index >= cards.length - 1;

  return (
    <div className="space-y-6">
      {/* Header row (Quizlet-ish) */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-3xl font-extrabold text-slate-900">
              {deck?.title ?? "Flashcards"}
            </div>
            <div className="text-slate-500 font-semibold">— {deck?.subtitle}</div>
          </div>

          {/* Deck switch (simple) */}
          <div className="flex flex-wrap gap-2">
            {DEMO_DECKS.map((d) => {
              const active = d.id === activeDeckId;
              return (
                <button
                  key={d.id}
                  onClick={() => setActiveDeckId(d.id)}
                  className={[
                    "px-3 py-1.5 rounded-full border text-sm font-bold transition",
                    active
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {d.title}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-bold hover:bg-slate-50 transition">
            Save
          </button>
          <button className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-bold hover:bg-slate-50 transition">
            Share
          </button>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition"
          >
            Back
          </Link>
        </div>
      </div>

      {/* Tabs (Flashcards/Learn/Test/Match) */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={[
                "px-4 py-2 rounded-xl border font-bold transition",
                active
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                  : "bg-white text-slate-800 border-slate-200 hover:bg-slate-50",
              ].join(" ")}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Main viewer area */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Viewer top bar */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-200">
          <div className="text-sm font-bold text-slate-700">
            {tab === "flashcards" ? "Flashcards" : "Preview"} •{" "}
            <span className="text-slate-500">{progressText}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={flip}
              className="px-3 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition"
              disabled={!current}
              title="Space to flip"
            >
              Flip (Space)
            </button>
            <button
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-bold hover:bg-slate-50 transition"
              disabled={!current}
              onClick={() => setIsFlipped(false)}
              title="Show question"
            >
              Front
            </button>
            <button
              className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-bold hover:bg-slate-50 transition"
              disabled={!current}
              onClick={() => setIsFlipped(true)}
              title="Show answer"
            >
              Back
            </button>
          </div>
        </div>

        {/* Card */}
        <div className="p-4 sm:p-8">
          {!current ? (
            <div className="rounded-2xl border border-slate-200 p-10 text-center text-slate-600">
              No cards in this deck yet.
            </div>
          ) : (
            <div className="mx-auto max-w-4xl">
              {/* 3D flip container */}
              <button
                onClick={flip}
                className="w-full text-left"
                aria-label="Flip card"
              >
                <div className="relative h-[360px] sm:h-[420px] [perspective:1400px]">
                  <div
                    className={[
                      "absolute inset-0 rounded-3xl border border-slate-200 shadow-sm",
                      "bg-gradient-to-b from-white to-slate-50",
                      "transition-transform duration-500 [transform-style:preserve-3d]",
                      isFlipped ? "[transform:rotateY(180deg)]" : "",
                    ].join(" ")}
                  >
                    {/* Front */}
                    <div className="absolute inset-0 p-8 sm:p-10 [backface-visibility:hidden]">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                          Question
                        </div>
                        <div className="text-sm text-slate-500 font-semibold">
                          Click to reveal
                        </div>
                      </div>

                      <div className="mt-10 text-center">
                        <div className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-snug">
                          {current.front}
                        </div>
                      </div>

                      <div className="mt-10 text-center text-sm text-slate-500">
                        Tip: press <span className="font-bold text-slate-700">Space</span> to flip •{" "}
                        <span className="font-bold text-slate-700">←/→</span> to navigate
                      </div>
                    </div>

                    {/* Back */}
                    <div className="absolute inset-0 p-8 sm:p-10 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold px-2 py-1 rounded-full bg-indigo-100 text-indigo-700">
                          Answer
                        </div>
                        <div className="text-sm text-slate-500 font-semibold">
                          Click to go back
                        </div>
                      </div>

                      <div className="mt-10 text-center">
                        <div className="text-xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
                          {current.back}
                        </div>
                      </div>

                      <div className="mt-10 text-center text-sm text-slate-500">
                        Self-check: can you explain this in your own words?
                      </div>
                    </div>
                  </div>
                </div>
              </button>

              {/* Bottom controls (Quizlet-style) */}
              <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  onClick={prev}
                  disabled={disabledPrev}
                  className={[
                    "w-full sm:w-auto px-5 py-3 rounded-xl font-bold border transition",
                    disabledPrev
                      ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                      : "bg-white text-slate-900 border-slate-200 hover:bg-slate-50",
                  ].join(" ")}
                >
                  ← Prev
                </button>

                <div className="flex items-center gap-3">
                  <div className="text-sm font-bold text-slate-700">{progressText}</div>
                  <div className="w-44 sm:w-64 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full bg-slate-900"
                      style={{
                        width: cards.length ? `${((index + 1) / cards.length) * 100}%` : "0%",
                      }}
                    />
                  </div>
                </div>

                <button
                  onClick={next}
                  disabled={disabledNext}
                  className={[
                    "w-full sm:w-auto px-5 py-3 rounded-xl font-bold border transition",
                    disabledNext
                      ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                      : "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700",
                  ].join(" ")}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <div className="flex justify-between text-sm">
        <Link href="/dashboard/files" className="font-semibold text-slate-700 hover:text-slate-900">
          ← Files
        </Link>
        <Link href="/dashboard/quizzes" className="font-semibold text-indigo-600 hover:text-indigo-700">
          Quizzes →
        </Link>
      </div>
    </div>
  );
}
