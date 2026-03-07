"use client";

import Link from "next/link";
import { useFlashcardNav } from "./hooks/useFlashcardNav";
import { TABS } from "./constants/flashcards";
import FlashcardStyles from "./components/FlashcardStyles";
import DeckSwitcher from "./components/DeckSwitcher";
import FlashcardViewer from "./components/FlashcardViewer";

export default function FlashcardsPage() {
  const nav = useFlashcardNav();
  const {
    activeDeckId, setActiveDeckId, tab, setTab,
    index, isFlipped, setIsFlipped,
    deck, cards, current, accentColor, progressPct,
    flip, prev, next, goToCard,
    disabledPrev, disabledNext,
  } = nav;

  return (
    <>
      <FlashcardStyles accentColor={accentColor} />

      <div className="fc-root space-y-5" style={{ "--accent": accentColor }}>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold tracking-widest uppercase text-slate-400 dark:text-slate-500 mb-1">Study Set</p>
              <div className="flex flex-wrap items-baseline gap-3">
                <h1 className="text-4xl font-bold text-slate-900 dark:text-white leading-none">
                  {deck?.title ?? "Flashcards"}
                </h1>
                <span
                  className="text-sm font-medium px-2.5 py-1 rounded-full"
                  style={{ background: `color-mix(in srgb, ${accentColor} 12%, transparent)`, color: accentColor }}
                >
                  {deck?.subtitle}
                </span>
              </div>
            </div>
            <DeckSwitcher activeDeckId={activeDeckId} setActiveDeckId={setActiveDeckId} />
          </div>

          <div className="flex gap-2 shrink-0">
            {["Save", "Share"].map((label) => (
              <button
                key={label}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-600 hover:border-slate-300 dark:hover:border-slate-500 transition-all"
              >
                {label}
              </button>
            ))}
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: accentColor }}
            >
              &larr; Back
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700 pb-0">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative px-4 py-2.5 text-sm font-semibold transition-colors rounded-t-lg fc-tab-active ${
                  active
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                } ${active ? "fc-tab-active" : ""}`}
                style={active ? { "--accent": accentColor } : {}}
              >
                <span className="mr-1.5 opacity-60">{t.icon}</span>
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Main Card Viewer */}
        <FlashcardViewer
          current={current}
          isFlipped={isFlipped}
          setIsFlipped={setIsFlipped}
          accentColor={accentColor}
          tab={tab}
          index={index}
          cards={cards}
          progressPct={progressPct}
          disabledPrev={disabledPrev}
          disabledNext={disabledNext}
          flip={flip}
          prev={prev}
          next={next}
          goToCard={goToCard}
        />

        {/* Footer */}
        <div className="flex justify-between items-center text-sm pt-1">
          <Link href="/dashboard/files" className="flex items-center gap-1.5 font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors group">
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
