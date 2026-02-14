"use client";

import React, { useEffect, useMemo, useState } from "react";
import QUIZ from "../data/dsaQuiz.json";


// IMPORTANT: adjust this import if your folder structure is different
import { usePomodoro } from "../components/PomodoroProvider";

export default function QuizzesPage() {
  // Quiz UI state
  const [view, setView] = useState("quiz"); // "quiz" | "results"
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [questionId]: optionIndex }

  const q = useMemo(() => QUIZ.questions[currentIndex], [currentIndex]);
  const pickedForCurrent = answers[q?.id];

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === QUIZ.questions.length - 1;

  const score = useMemo(() => {
    let s = 0;
    for (const question of QUIZ.questions) {
      const picked = answers[question.id];
      if (picked === question.correctIndex) s += 1;
    }
    return s;
  }, [answers]);

  // ✅ Pomodoro integration (existing)
  const {
    mm,
    ss,
    isRunning,
    mode,
    modeLabel,
    cycleCount,
    setStudyMinutes,
    switchMode,
    start,
    pause,
    resetTimer
  } = usePomodoro();

  // Track this quiz's focus completion
  const [quizActive, setQuizActive] = useState(false);
  const [cycleBaseline, setCycleBaseline] = useState(null);

  const startQuizPomodoro = () => {
    switchMode("focus");
    setStudyMinutes(25);
    resetTimer();
    start();

    setQuizActive(true);
    setCycleBaseline(cycleCount);
  };

  // Auto-finish when a focus session completes
  useEffect(() => {
    if (!quizActive) return;
    if (cycleBaseline == null) return;

    if (cycleCount > cycleBaseline) {
      setQuizActive(false);
      setView("results");
      pause();
    }
  }, [quizActive, cycleBaseline, cycleCount, pause]);

  const selectAnswer = (optionIndex) => {
    setAnswers((prev) => ({ ...prev, [q.id]: optionIndex }));
  };

  const resetQuiz = () => {
    setView("quiz");
    setCurrentIndex(0);
    setAnswers({});
    setQuizActive(false);
    setCycleBaseline(null);
    pause();
    resetTimer();
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-blue-50 text-gray-900">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 sm:mb-14">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-4">
            Quizzes
          </h1>
        </div>

        {view === "quiz" && q && (
          <section className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">{QUIZ.title}</h2>
                <p className="text-gray-600">
                  Question {currentIndex + 1} / {QUIZ.questions.length}
                </p>
              </div>

              <div className="text-right">
                <div className="text-sm text-gray-500">{modeLabel}</div>
                <div className="text-2xl font-bold tabular-nums">
                  {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
                </div>

                <div className="flex gap-2 mt-2 justify-end">
                  <button
                    type="button"
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-60"
                    onClick={startQuizPomodoro}
                    disabled={isRunning && mode === "focus"}
                  >
                    Start Quiz (25m)
                  </button>

                  <button
                    type="button"
                    className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
                    onClick={pause}
                  >
                    Pause
                  </button>
                </div>

                <div className="text-xs text-gray-500 mt-2">
                  Auto-finishes when focus ends.
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">{q.prompt}</h3>

              <div className="space-y-2">
                {q.options.map((opt, i) => {
                  const isPicked = pickedForCurrent === i;
                  const showCorrectness = pickedForCurrent !== undefined;
                  const isCorrect = i === q.correctIndex;

                  let extraStyle = "";
                  if (showCorrectness && isCorrect)
                    extraStyle = "border-green-500 bg-green-50";
                  if (showCorrectness && isPicked && !isCorrect)
                    extraStyle = "border-red-500 bg-red-50";
                  if (!showCorrectness && isPicked)
                    extraStyle = "border-blue-500 bg-blue-50";

                  return (
                    <button
                      key={`${q.id}-${i}`}
                      type="button"
                      onClick={() => selectAnswer(i)}
                      className={`w-full text-left px-4 py-2 rounded border border-gray-300 hover:bg-gray-50 ${extraStyle}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <button
                type="button"
                disabled={isFirst}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                onClick={() => setCurrentIndex((x) => x - 1)}
              >
                Back
              </button>

              {!isLast ? (
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                  onClick={() => setCurrentIndex((x) => x + 1)}
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                  onClick={() => setView("results")}
                >
                  Finish Now
                </button>
              )}
            </div>
          </section>
        )}

        {view === "results" && (
          <section className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-2">Results</h2>
            <p className="text-gray-700 mb-4">
              You scored <span className="font-semibold">{score}</span> /{" "}
              {QUIZ.questions.length}
            </p>

            <div className="space-y-3">
              {QUIZ.questions.map((question) => {
                const picked = answers[question.id];
                const correct = question.correctIndex;
                const ok = picked === correct;

                return (
                  <div key={question.id} className="border rounded p-3">
                    <div className="font-semibold">{question.prompt}</div>
                    <div className={`mt-1 ${ok ? "text-green-700" : "text-red-700"}`}>
                      Your answer:{" "}
                      {picked === undefined ? "No answer" : question.options[picked]}
                    </div>
                    {!ok && (
                      <div className="text-green-700">
                        Correct answer: {question.options[correct]}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={resetQuiz}
              >
                Retry Quiz (New Focus)
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
