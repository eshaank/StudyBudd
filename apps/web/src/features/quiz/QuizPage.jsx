"use client";

import { useEffect } from "react";
import { useQuizState } from "./hooks/useQuizState";
import QuizStyles from "./components/QuizStyles";
import QuizView from "./components/QuizView";
import ResultsView from "./components/ResultsView";
import QuizSetSwitcher from "./components/QuizSetSwitcher";
import GenerateQuizModal from "./components/GenerateQuizModal";
import { useStudyAIPanel } from "../../app/components/StudyAIPanelProvider";

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
        <div className="qz-wrap">

          {/* Header */}
          <div className="qz-header">
            <div>
              <h1 className="qz-title">{quizTitle}</h1>
              <p className="qz-subtitle">
                {view === "quiz" && questions.length
                  ? `${questions.length} questions \u00B7 answer to unlock explanation`
                  : view === "results"
                  ? "Session complete \u00B7 review your answers below"
                  : "Generate a quiz from your documents"}
              </p>

              <QuizSetSwitcher
                quizSets={quizSets}
                activeSetId={activeSetId}
                setActiveSetId={setActiveSetId}
                onDelete={handleDeleteSet}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  className="qz-tbtn"
                  style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)", color: "#fff", padding: "6px 14px", borderRadius: 10, border: "none", fontFamily: "Sora, sans-serif", cursor: "pointer" }}
                  onClick={() => { fetchFolders(); setShowGenerate(true); }}
                >
                  + Generate
                </button>
                {activeSetId && (
                  <button
                    className="qz-tbtn"
                    style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", padding: "6px 14px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.3)", fontFamily: "Sora, sans-serif", cursor: "pointer" }}
                    onClick={() => handleDeleteSet(activeSetId)}
                  >
                    Delete
                  </button>
                )}
              </div>

              <div className="qz-timer">
                <div className="qz-timer-mode">{modeLabel}</div>
                <div className="qz-timer-digits">
                  {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
                </div>
                <div className="qz-timer-btns">
                  <button type="button" className="qz-tbtn" style={{ background: "#1d4ed8", color: "#fff" }} onClick={startQuizPomodoro} disabled={isRunning && mode === "focus"}>Focus 25m</button>
                  <button type="button" className="qz-tbtn" style={{ background: "rgba(255,255,255,0.07)", color: "#64748b" }} onClick={pause}>Pause</button>
                </div>
              </div>
            </div>
          </div>

          {/* Empty state */}
          {!questions.length && view === "quiz" && (
            <div className="qz-card" style={{ textAlign: "center", padding: "3rem 2rem" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: 12 }}>📝</div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f1f5f9", marginBottom: 8 }}>
                {quizSets.length ? "Select a quiz set above" : "No quizzes yet"}
              </div>
              <div style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: 20 }}>
                Generate quiz questions from your uploaded study materials.
              </div>
              <button
                className="qz-tbtn"
                style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)", color: "#fff", padding: "10px 24px", borderRadius: 12, fontSize: "0.85rem", border: "none", fontFamily: "Sora, sans-serif", cursor: "pointer" }}
                onClick={() => { fetchFolders(); setShowGenerate(true); }}
              >
                + Generate Quiz
              </button>
            </div>
          )}

          {/* Quiz view */}
          {view === "quiz" && q && (
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
          )}

          {/* Results view */}
          {view === "results" && (
            <ResultsView
              questions={questions}
              score={score}
              breakdown={breakdown}
              resetQuiz={resetQuiz}
            />
          )}

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
