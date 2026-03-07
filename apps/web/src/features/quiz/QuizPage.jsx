"use client";

import { useQuizState } from "./hooks/useQuizState";
import QuizStyles from "./components/QuizStyles";
import QuizView from "./components/QuizView";
import ResultsView from "./components/ResultsView";

export default function QuizPage({ quiz }) {
  const state = useQuizState(quiz);
  const {
    view, q, currentIndex, cardKey, pickedForCurrent, hasAnswered,
    isFirst, isLast, score, progressPct, breakdown, shakeRef,
    mm, ss, isRunning, mode, modeLabel,
    startQuizPomodoro, selectAnswer, goNext, goBack, resetQuiz, pause,
  } = state;

  return (
    <>
      <QuizStyles />

      <div className="qz-root">
        <div className="qz-wrap">

          {/* Header */}
          <div className="qz-header">
            <div>
              <h1 className="qz-title">{quiz.title ?? "Quiz"}</h1>
              <p className="qz-subtitle">
                {view === "quiz"
                  ? `${quiz.questions.length} questions \u00B7 answer to unlock explanation`
                  : "Session complete \u00B7 review your answers below"}
              </p>
            </div>

            <div className="qz-timer">
              <div className="qz-timer-mode">{modeLabel}</div>
              <div className="qz-timer-digits">
                {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
              </div>
              <div className="qz-timer-btns">
                <button
                  type="button" className="qz-tbtn"
                  style={{ background: "#1d4ed8", color: "#fff" }}
                  onClick={startQuizPomodoro}
                  disabled={isRunning && mode === "focus"}
                >
                  Focus 25m
                </button>
                <button
                  type="button" className="qz-tbtn"
                  style={{ background: "rgba(255,255,255,0.07)", color: "#64748b" }}
                  onClick={pause}
                >
                  Pause
                </button>
              </div>
            </div>
          </div>

          {/* Quiz view */}
          {view === "quiz" && q && (
            <QuizView
              quiz={quiz}
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
              quiz={quiz}
              score={score}
              breakdown={breakdown}
              resetQuiz={resetQuiz}
            />
          )}

        </div>
      </div>
    </>
  );
}
