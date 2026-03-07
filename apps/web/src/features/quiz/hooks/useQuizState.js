import { useEffect, useMemo, useState } from "react";
import { usePomodoro } from "../../../app/components/PomodoroProvider";
import { useShake } from "./useShake";

export function useQuizState(quiz) {
  const [view, setView] = useState("quiz");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [shakeKey, setShakeKey] = useState(0);
  const [cardKey, setCardKey] = useState(0);

  const q = useMemo(() => quiz.questions[currentIndex], [quiz, currentIndex]);
  const pickedForCurrent = answers[q?.id];
  const hasAnswered = pickedForCurrent !== undefined;

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === quiz.questions.length - 1;

  const score = useMemo(() => {
    let s = 0;
    for (const question of quiz.questions) {
      if (answers[question.id] === question.correctIndex) s++;
    }
    return s;
  }, [quiz, answers]);

  const { mm, ss, isRunning, mode, modeLabel, cycleCount, setStudyMinutes, switchMode, start, pause, resetTimer } = usePomodoro();
  const [quizActive, setQuizActive] = useState(false);
  const [cycleBaseline, setCycleBaseline] = useState(null);
  const shakeRef = useShake(shakeKey);

  function startQuizPomodoro() {
    switchMode("focus"); setStudyMinutes(25); resetTimer(); start();
    setQuizActive(true); setCycleBaseline(cycleCount);
  }

  useEffect(() => {
    if (!quizActive || cycleBaseline == null) return;
    if (cycleCount > cycleBaseline) { setQuizActive(false); setView("results"); pause(); }
  }, [quizActive, cycleBaseline, cycleCount, pause]);

  function selectAnswer(optionIndex) {
    if (hasAnswered) return;
    setAnswers((prev) => ({ ...prev, [q.id]: optionIndex }));
    if (optionIndex !== q.correctIndex) setShakeKey((k) => k + 1);
  }

  function goNext() {
    if (isLast) { setView("results"); }
    else { setCurrentIndex((i) => i + 1); setCardKey((k) => k + 1); }
  }

  function goBack() {
    setCurrentIndex((x) => x - 1);
  }

  function resetQuiz() {
    setView("quiz"); setCurrentIndex(0); setAnswers({});
    setQuizActive(false); setCycleBaseline(null);
    setCardKey((k) => k + 1); pause(); resetTimer();
  }

  const progressPct = quiz.questions.length
    ? ((currentIndex + (hasAnswered ? 1 : 0)) / quiz.questions.length) * 100
    : 0;

  const breakdown = useMemo(() =>
    quiz.questions.map((question) => ({
      question,
      picked: answers[question.id],
      correct: question.correctIndex,
      ok: answers[question.id] === question.correctIndex,
    })), [quiz, answers]);

  return {
    view, q, currentIndex, cardKey, pickedForCurrent, hasAnswered,
    isFirst, isLast, score, progressPct, breakdown, shakeRef,
    mm, ss, isRunning, mode, modeLabel,
    startQuizPomodoro, selectAnswer, goNext, goBack, resetQuiz, pause,
  };
}
