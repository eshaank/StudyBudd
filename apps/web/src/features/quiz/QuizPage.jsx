"use client";

import Link from "next/link";
import { useEffect } from "react";
import { ClipboardList } from "lucide-react";
import { useQuizState } from "./hooks/useQuizState";
import QuizStyles from "./components/QuizStyles";
import QuizView from "./components/QuizView";
import ResultsView from "./components/ResultsView";
import QuizSetSwitcher from "./components/QuizSetSwitcher";
import GenerateQuizModal from "./components/GenerateQuizModal";
import { useStudyAIPanel } from "../../app/components/StudyAIPanelProvider";

const ACCENT = "#6366f1";

export default function QuizPage() {
  const state = useQuizState();
  const {
    quizSets, activeSetId, setActiveSetId, quizTitle, pageLoading,
    questions, view, q, currentIndex, cardKey, pickedForCurrent, hasAnswered,
    isFirst, isLast, score, progressPct, breakdown, shakeRef,
    mm, ss, isRunning, mode, modeLabel,
    startQuizPomodoro, selectAnswer, goNext, goBack, resetQuiz, pause,
    handleGenerate, handleDeleteSet, fetchFolders,
    showGenerate, setShowGenerate, folders,
  } = state;

  const { setStudyContext } = useStudyAIPanel();

  // Provide quiz context to the global AI panel
  useEffect(() => {
    if (q) {
      setStudyContext({
        type: "quiz",
        question: q.question,
        options: q.options,
        quizTitle,
      });
    } else {
      setStudyContext(null);
    }
  }, [q, quizTitle, setStudyContext]);

  // Clear context on unmount
  useEffect(() => {
    return () => setStudyContext(null);
  }, [setStudyContext]);

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <>
      <QuizStyles />

      <div className="qz-root">
        {/* Compact toolbar — mirrors flashcard page */}
        <div className="flex items-center gap-2 min-w-0 mb-5">
          {quizSets.length > 0 && (
            <QuizSetSwitcher
              quizSets={quizSets}
              activeSetId={activeSetId}
              setActiveSetId={setActiveSetId}
              onDelete={handleDeleteSet}
            />
          )}

          <div className="flex-1" />

          <div className="flex gap-2 shrink-0 items-center">
            {/* Compact timer */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {modeLabel}
              </span>
              <span className="text-sm font-bold tabular-nums text-slate-700 dark:text-slate-300 font-mono">
                {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
              </span>
              <div className="flex gap-1 ml-1">
                <button
                  type="button"
                  onClick={startQuizPomodoro}
                  disabled={isRunning && mode === "focus"}
                  className="px-2 py-1 rounded-lg text-[11px] font-bold text-white disabled:opacity-40 transition-all hover:opacity-90"
                  style={{ background: ACCENT }}
                >
                  Focus
                </button>
                <button
                  type="button"
                  onClick={pause}
                  className="px-2 py-1 rounded-lg text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 transition-all"
                >
                  Pause
                </button>
              </div>
            </div>

            <button
              onClick={() => { fetchFolders(); setShowGenerate(true); }}
              className="px-3 py-2 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: ACCENT }}
            >
              + Generate
            </button>
            {activeSetId && (
              <button
                onClick={() => handleDeleteSet(activeSetId)}
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

        {/* Mobile timer row */}
        <div className="sm:hidden flex items-center gap-2 mb-4 px-3 py-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {modeLabel}
          </span>
          <span className="text-sm font-bold tabular-nums text-slate-700 dark:text-slate-300 font-mono">
            {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
          </span>
          <div className="flex gap-1 ml-auto">
            <button
              type="button"
              onClick={startQuizPomodoro}
              disabled={isRunning && mode === "focus"}
              className="px-2 py-1 rounded-lg text-[11px] font-bold text-white disabled:opacity-40 transition-all hover:opacity-90"
              style={{ background: ACCENT }}
            >
              Focus
            </button>
            <button
              type="button"
              onClick={pause}
              className="px-2 py-1 rounded-lg text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-600 hover:bg-slate-200 dark:hover:bg-slate-500 transition-all"
            >
              Pause
            </button>
          </div>
        </div>

        {/* Content */}
        {!questions.length && view === "quiz" ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 p-12 text-center">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 text-slate-400 dark:text-slate-500" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">
              {quizSets.length ? "Select a quiz set above" : "No quizzes yet"}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-5">
              Generate quiz questions from your uploaded study materials.
            </p>
            <button
              onClick={() => { fetchFolders(); setShowGenerate(true); }}
              className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
              style={{ background: ACCENT }}
            >
              + Generate Quiz
            </button>
          </div>
        ) : view === "quiz" && q ? (
          <div className="max-w-3xl mx-auto">
            <QuizView
              questions={questions}
              q={q}
              currentIndex={currentIndex}
              cardKey={cardKey}
              pickedForCurrent={pickedForCurrent}
              hasAnswered={hasAnswered}
              isFirst={isFirst}
              isLast={isLast}
              progressPct={progressPct}
              shakeRef={shakeRef}
              selectAnswer={selectAnswer}
              goNext={goNext}
              goBack={goBack}
            />
          </div>
        ) : view === "results" ? (
          <div className="max-w-3xl mx-auto">
            <ResultsView
              questions={questions}
              score={score}
              breakdown={breakdown}
              resetQuiz={resetQuiz}
            />
          </div>
        ) : null}

        {/* Footer nav — mirrors flashcard page */}
        <div className="flex justify-between items-center text-sm pt-3">
          <Link
            href="/dashboard/flashcards"
            className="flex items-center gap-1.5 font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors group"
          >
            <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 14 14">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Flashcards
          </Link>
          <Link
            href="/dashboard/files"
            className="flex items-center gap-1.5 font-semibold transition-colors group hover:opacity-80"
            style={{ color: ACCENT }}
          >
            Files
            <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 14 14">
              <path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
      </div>

      {showGenerate && (
        <GenerateQuizModal
          folders={folders}
          onGenerate={handleGenerate}
          onClose={() => setShowGenerate(false)}
        />
      )}
    </>
  );
}
