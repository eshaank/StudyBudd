"use client";

import Link from "next/link";
import { useEffect } from "react";
import { BookOpen } from "lucide-react";
import { useFlashcardNav } from "./hooks/useFlashcardNav";
import { TABS } from "./constants/flashcards";
import FlashcardStyles from "./components/FlashcardStyles";
import DeckSwitcher from "./components/DeckSwitcher";
import FlashcardViewer from "./components/FlashcardViewer";
import GenerateModal from "./components/GenerateModal";
import { useStudyAIPanel } from "../../components/StudyAIPanelProvider";

export default function FlashcardsPage() {
  const nav = useFlashcardNav();
  const {
    decks, activeDeckId, setActiveDeckId, tab, setTab,
    index, isFlipped, setIsFlipped, loading,
    deck, cards, current, accentColor, progressPct,
    flip, prev, next, goToCard,
    disabledPrev, disabledNext,
    deleteDeck, handleGenerate, fetchFolders,
    showGenerate, setShowGenerate, folders,
    sources, showCardSources, setShowCardSources,
  } = nav;

  const { setStudyContext } = useStudyAIPanel();

  // Provide flashcard context to the global AI panel
  useEffect(() => {
    if (current) {
      setStudyContext({
        type: "flashcard",
        question: current.front,
        answer: isFlipped ? current.back : undefined,
        deckTitle: deck?.title,
      });
    } else {
      setStudyContext(null);
    }
  }, [current, isFlipped, deck?.title, setStudyContext]);

  // Clear context on unmount
  useEffect(() => {
    return () => setStudyContext(null);
  }, [setStudyContext]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <>
      <FlashcardStyles accentColor={accentColor} />

      <div className="fc-root" style={{ "--accent": accentColor }}>

        {/* Compact toolbar */}
        <div className="flex items-center gap-2 min-w-0 mb-5">
          {decks.length > 0 && (
            <DeckSwitcher
              decks={decks}
              activeDeckId={activeDeckId}
              setActiveDeckId={setActiveDeckId}
              onDelete={deleteDeck}
            />
          )}

          <div className="flex-1" />

          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => { fetchFolders(); setShowGenerate(true); }}
              className="px-3 py-2 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: accentColor }}
            >
              + Generate
            </button>
            {deck && (
              <button
                onClick={() => deleteDeck(deck.id)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-700 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
              >
                Delete
              </button>
            )}
            <Link
              href="/dashboard"
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-600 transition-all"
            >
              &larr; Back
            </Link>
          </div>
        </div>

        {/* Main content */}
        {!decks.length ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-12 text-center">
            <BookOpen className="w-10 h-10 mx-auto mb-3 text-slate-400 dark:text-slate-500" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">No flashcard sets yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-5">Generate flashcards from your uploaded documents to start studying.</p>
            <button
              onClick={() => { fetchFolders(); setShowGenerate(true); }}
              className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: accentColor }}
            >
              + Generate Flashcards
            </button>
          </div>
        ) : (
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
            sources={sources}
            showCardSources={showCardSources}
            setShowCardSources={setShowCardSources}
          />
        )}

        {/* Footer */}
        <div className="flex justify-between items-center text-sm pt-3">
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

      {showGenerate && (
        <GenerateModal
          folders={folders}
          onGenerate={handleGenerate}
          onClose={() => setShowGenerate(false)}
          accentColor={accentColor}
        />
      )}
    </>
  );
}
