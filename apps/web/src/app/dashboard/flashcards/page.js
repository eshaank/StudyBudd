"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const DEMO_DECKS = [
  { id: "phil-100", title: "PHIL-100", subtitle: "Free Will & Determinism", total: 42, color: "#6366f1" },
  { id: "cse-130", title: "CSE-130", subtitle: "Virtual Memory & AMAT", total: 55, color: "#0ea5e9" },
  { id: "cse-114a", title: "CSE-114A", subtitle: "Haskell & Recursion", total: 30, color: "#10b981" },
];

const DEMO_CARDS = [
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

const TABS = [
  { key: "flashcards", label: "Flashcards", icon: "⬡" },
  { key: "learn", label: "Learn", icon: "◈" },
  { key: "test", label: "Test", icon: "◎" },
  { key: "match", label: "Match", icon: "⬙" },
];

export default function FlashcardsPage() {
  const [activeDeckId, setActiveDeckId] = useState(DEMO_DECKS[0].id);
  const [tab, setTab] = useState("flashcards");
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const deck = useMemo(() => DEMO_DECKS.find((d) => d.id === activeDeckId), [activeDeckId]);
  const cards = useMemo(() => DEMO_CARDS.filter((c) => c.deckId === activeDeckId), [activeDeckId]);
  const current = useMemo(() => {
    if (!cards.length) return null;
    return cards[Math.min(index, cards.length - 1)];
  }, [cards, index]);

  useEffect(() => {
    setIndex(0);
    setIsFlipped(false);
  }, [activeDeckId]);

  function flip() {
    if (isAnimating) return;
    setIsAnimating(true);
    setIsFlipped((v) => !v);
    setTimeout(() => setIsAnimating(false), 500);
  }

  function prev() {
    setIsFlipped(false);
    setIndex((i) => Math.max(0, i - 1));
  }

  function next() {
    setIsFlipped(false);
    setIndex((i) => Math.min(cards.length - 1, i + 1));
  }

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === " " || e.code === "Space") { e.preventDefault(); flip(); }
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards.length, isAnimating]);

  const progressPct = cards.length ? ((index + 1) / cards.length) * 100 : 0;
  const disabledPrev = index <= 0;
  const disabledNext = index >= cards.length - 1;
  const accentColor = deck?.color ?? "#6366f1";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;1,9..40,300&display=swap');

        .fc-root {
          font-family: 'DM Sans', sans-serif;
          --accent: ${accentColor};
        }

        .fc-card-scene { perspective: 1800px; }

        .fc-card-inner {
          position: relative;
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          transition: transform 0.55s cubic-bezier(0.645, 0.045, 0.355, 1.000);
        }

        .fc-card-inner.flipped { transform: rotateY(180deg); }

        .fc-card-face {
          position: absolute;
          inset: 0;
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }

        .fc-card-back { transform: rotateY(180deg); }

        .fc-tab-active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 2px;
          background: var(--accent);
          border-radius: 2px;
        }

        .fc-deck-pill {
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }

        .fc-deck-pill::before {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--accent);
          opacity: 0;
          transition: opacity 0.2s;
        }

        .fc-deck-pill.active::before { opacity: 1; }

        .fc-progress-fill {
          transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          background: var(--accent);
        }

        .fc-nav-btn {
          transition: all 0.2s ease;
        }

        .fc-nav-btn:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        }

        .fc-card-glow {
          position: absolute;
          inset: -1px;
          border-radius: 24px;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s;
          box-shadow: 0 0 0 1px var(--accent), 0 8px 40px color-mix(in srgb, var(--accent) 20%, transparent);
        }

        .fc-card-wrapper:hover .fc-card-glow { opacity: 1; }

        .fc-serif { font-family: 'DM Serif Display', serif; }

        .fc-shine {
          background: linear-gradient(135deg,
            rgba(255,255,255,0.0) 40%,
            rgba(255,255,255,0.06) 50%,
            rgba(255,255,255,0.0) 60%
          );
        }
      `}</style>

      <div className="fc-root space-y-5" style={{ "--accent": accentColor }}>

        {/* ── Header ── */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-slate-400 mb-1">Study Set</p>
              <div className="flex flex-wrap items-baseline gap-3">
                <h1 className="fc-serif text-4xl text-slate-900 leading-none">
                  {deck?.title ?? "Flashcards"}
                </h1>
                <span
                  className="text-sm font-medium px-2.5 py-1 rounded-full"
                  style={{ background: `color-mix(in srgb, ${accentColor} 12%, white)`, color: accentColor }}
                >
                  {deck?.subtitle}
                </span>
              </div>
            </div>

            {/* Deck switcher */}
            <div className="flex flex-wrap gap-2">
              {DEMO_DECKS.map((d) => {
                const active = d.id === activeDeckId;
                return (
                  <button
                    key={d.id}
                    onClick={() => setActiveDeckId(d.id)}
                    className="fc-deck-pill relative px-3.5 py-1.5 rounded-full text-sm font-semibold border"
                    style={{
                      "--accent": d.color,
                      borderColor: active ? d.color : "#e2e8f0",
                      color: active ? "#fff" : "#475569",
                      background: active ? d.color : "#fff",
                    }}
                  >
                    {d.title}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 shrink-0">
            {["Save", "Share"].map((label) => (
              <button
                key={label}
                className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                {label}
              </button>
            ))}
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: accentColor }}
            >
              ← Back
            </Link>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-1 border-b border-slate-200 pb-0">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative px-4 py-2.5 text-sm font-semibold transition-colors rounded-t-lg fc-tab-active ${
                  active
                    ? "text-slate-900"
                    : "text-slate-500 hover:text-slate-700"
                } ${active ? "fc-tab-active" : ""}`}
                style={active ? { "--accent": accentColor } : {}}
              >
                <span className="mr-1.5 opacity-60">{t.icon}</span>
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── Main Card Viewer ── */}
        <div className="rounded-2xl border border-slate-100 bg-gradient-to-b from-slate-50 to-white shadow-sm overflow-hidden">

          {/* Top bar */}
          <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-100 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-2.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: accentColor }}
              />
              <span className="text-sm font-semibold text-slate-700">
                {tab === "flashcards" ? "Flashcards" : "Preview"}
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-sm text-slate-500 tabular-nums">
                {cards.length ? `${index + 1} of ${cards.length}` : "0 of 0"}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsFlipped(false)}
                disabled={!current}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                Front
              </button>
              <button
                onClick={flip}
                disabled={!current}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40 transition hover:opacity-90"
                style={{ background: accentColor }}
              >
                Flip <kbd className="ml-1 opacity-75 font-mono">Space</kbd>
              </button>
              <button
                onClick={() => setIsFlipped(true)}
                disabled={!current}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
              >
                Back
              </button>
            </div>
          </div>

          {/* Card area */}
          <div className="p-5 sm:p-8">
            {!current ? (
              <div className="h-64 flex items-center justify-center rounded-2xl border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-medium">No cards in this deck yet.</p>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-5">

                {/* 3-D flip card */}
                <div className="fc-card-wrapper relative cursor-pointer" onClick={flip}>
                  <div className="fc-card-glow" style={{ "--accent": accentColor }} />

                  <div className="fc-card-scene h-[340px] sm:h-[400px]">
                    <div className={`fc-card-inner h-full ${isFlipped ? "flipped" : ""}`}>

                      {/* Front face */}
                      <div className="fc-card-face fc-card-front rounded-3xl border border-slate-200 bg-white shadow-md overflow-hidden">
                        <div className="fc-shine absolute inset-0 rounded-3xl pointer-events-none" />

                        {/* Decorative top strip */}
                        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${accentColor}, color-mix(in srgb, ${accentColor} 40%, transparent))` }} />

                        <div className="h-full flex flex-col px-8 sm:px-12 pt-7 pb-8">
                          <div className="flex items-center justify-between">
                            <span
                              className="text-[11px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
                              style={{ background: `color-mix(in srgb, ${accentColor} 10%, white)`, color: accentColor }}
                            >
                              Question
                            </span>
                            <span className="text-xs text-slate-400 font-medium">tap to reveal →</span>
                          </div>

                          <div className="flex-1 flex items-center justify-center py-4">
                            <p className="fc-serif text-center text-2xl sm:text-[2rem] leading-snug text-slate-900">
                              {current.front}
                            </p>
                          </div>

                          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400">
                            <span><kbd className="font-mono font-bold text-slate-500">Space</kbd> to flip</span>
                            <span className="opacity-40">·</span>
                            <span><kbd className="font-mono font-bold text-slate-500">←→</kbd> to navigate</span>
                          </div>
                        </div>
                      </div>

                      {/* Back face */}
                      <div className="fc-card-face fc-card-back rounded-3xl border overflow-hidden shadow-md"
                        style={{ borderColor: `color-mix(in srgb, ${accentColor} 30%, transparent)`, background: `linear-gradient(145deg, color-mix(in srgb, ${accentColor} 6%, white), white)` }}
                      >
                        <div className="h-1 w-full" style={{ background: accentColor }} />

                        <div className="h-full flex flex-col px-8 sm:px-12 pt-7 pb-8">
                          <div className="flex items-center justify-between">
                            <span
                              className="text-[11px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full text-white"
                              style={{ background: accentColor }}
                            >
                              Answer
                            </span>
                            <span className="text-xs text-slate-400 font-medium">← tap to go back</span>
                          </div>

                          <div className="flex-1 flex items-center justify-center py-4">
                            <p className="text-center text-xl sm:text-2xl leading-relaxed text-slate-800 font-medium">
                              {current.back}
                            </p>
                          </div>

                          <p className="text-center text-[11px] text-slate-400 italic">
                            Can you explain this in your own words?
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Navigation controls */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={prev}
                    disabled={disabledPrev}
                    className="fc-nav-btn flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm border transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Prev
                  </button>

                  {/* Progress */}
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="fc-progress-fill h-full rounded-full"
                        style={{ width: `${progressPct}%`, background: accentColor }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 tabular-nums">
                      <span>{index + 1}</span>
                      <span>{cards.length}</span>
                    </div>
                  </div>

                  <button
                    onClick={next}
                    disabled={disabledNext}
                    className="fc-nav-btn flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90"
                    style={{ background: disabledNext ? "#cbd5e1" : accentColor }}
                  >
                    Next
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>

                {/* Dot indicators */}
                <div className="flex items-center justify-center gap-1.5 pt-1">
                  {cards.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => { setIsFlipped(false); setIndex(i); }}
                      className="rounded-full transition-all duration-300"
                      style={{
                        width: i === index ? "20px" : "6px",
                        height: "6px",
                        background: i === index ? accentColor : "#cbd5e1",
                      }}
                      aria-label={`Go to card ${i + 1}`}
                    />
                  ))}
                </div>

              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="flex justify-between items-center text-sm pt-1">
          <Link href="/dashboard/files" className="flex items-center gap-1.5 font-semibold text-slate-500 hover:text-slate-800 transition-colors group">
            <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 14 14"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Files
          </Link>
          <Link
            href="/dashboard/quizzes"
            className="flex items-center gap-1.5 font-semibold transition-colors group hover:opacity-80"
            style={{ color: accentColor }}
          >
            Quizzes
            <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 14 14"><path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
        </div>

      </div>
    </>
  );
}