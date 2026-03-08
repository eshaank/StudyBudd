import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowser } from "../../../lib/supabase/client";
import { usePomodoro } from "../../../app/components/PomodoroProvider";
import { useShake } from "./useShake";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getAccessToken() {
  const supabase = createSupabaseBrowser();
  const { data: { session } } = await supabase.auth.getSession();
  const isDev = process.env.NODE_ENV === "development";
  return session?.access_token || (isDev ? "dev-token" : null);
}

export function useQuizState() {
  // Quiz set management
  const [quizSets, setQuizSets] = useState([]);
  const [activeSetId, setActiveSetId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [quizTitle, setQuizTitle] = useState("Quiz");
  const [pageLoading, setPageLoading] = useState(true);

  // Generate modal
  const [showGenerate, setShowGenerate] = useState(false);
  const [folders, setFolders] = useState([]);

  // Quiz state
  const [view, setView] = useState("quiz");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [shakeKey, setShakeKey] = useState(0);
  const [cardKey, setCardKey] = useState(0);

  const q = useMemo(() => questions[currentIndex], [questions, currentIndex]);
  const pickedForCurrent = q ? answers[q.id] : undefined;
  const hasAnswered = pickedForCurrent !== undefined;
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === questions.length - 1;

  const score = useMemo(() => {
    let s = 0;
    for (const question of questions) {
      if (answers[question.id] === question.correct_option) s++;
    }
    return s;
  }, [answers, questions]);

  const { mm, ss, isRunning, mode, modeLabel, cycleCount, setStudyMinutes, switchMode, start, pause, resetTimer } = usePomodoro();
  const [quizActive, setQuizActive] = useState(false);
  const [cycleBaseline, setCycleBaseline] = useState(null);
  const shakeRef = useShake(shakeKey);

  // --- API ---
  const fetchQuizSets = useCallback(async () => {
    try {
      const token = await getAccessToken();
      if (!token) return;
      const res = await fetch(`${API_URL}/api/quizzes/sets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch quiz sets");
      const data = await res.json();
      setQuizSets(data);
      if (data.length && !activeSetId) setActiveSetId(data[0].id);
    } catch (err) {
      console.error("Error fetching quiz sets:", err);
    } finally {
      setPageLoading(false);
    }
  }, [activeSetId]);

  const fetchQuiz = useCallback(async (setId) => {
    if (!setId) return;
    try {
      const token = await getAccessToken();
      const res = await fetch(`${API_URL}/api/quizzes/sets/${setId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch quiz");
      const data = await res.json();
      setQuestions(data.questions || []);
      setQuizTitle(data.title || "Quiz");
    } catch (err) {
      console.error("Error fetching quiz:", err);
      setQuestions([]);
    }
  }, []);

  const fetchFolders = useCallback(async () => {
    try {
      const token = await getAccessToken();
      const res = await fetch(`${API_URL}/api/folders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFolders(Array.isArray(data) ? data : data.folders ?? []);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchQuizSets(); }, [fetchQuizSets]);

  useEffect(() => {
    if (activeSetId) {
      resetQuizState();
      fetchQuiz(activeSetId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSetId, fetchQuiz]);

  async function handleGenerate({ folderId, topic, numQuestions }) {
    const token = await getAccessToken();
    const body = { num_questions: numQuestions };
    if (folderId) body.folder_id = folderId;
    if (topic?.trim()) body.topic = topic.trim();

    const res = await fetch(`${API_URL}/api/quizzes/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Generation failed");
    }
    const newSet = await res.json();
    await fetchQuizSets();
    setActiveSetId(newSet.id);
    return newSet;
  }

  async function handleDeleteSet(setId) {
    if (!confirm("Delete this quiz set?")) return;
    try {
      const token = await getAccessToken();
      await fetch(`${API_URL}/api/quizzes/sets/${setId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (activeSetId === setId) { setActiveSetId(null); setQuestions([]); }
      await fetchQuizSets();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  // --- Quiz logic ---
  function resetQuizState() {
    setView("quiz"); setCurrentIndex(0); setAnswers({});
    setQuizActive(false); setCycleBaseline(null);
    setCardKey((k) => k + 1); pause(); resetTimer();
  }

  function startQuizPomodoro() {
    switchMode("focus"); setStudyMinutes(25); resetTimer(); start();
    setQuizActive(true); setCycleBaseline(cycleCount);
  }

  useEffect(() => {
    if (!quizActive || cycleBaseline == null) return;
    if (cycleCount > cycleBaseline) { setQuizActive(false); setView("results"); pause(); }
  }, [quizActive, cycleBaseline, cycleCount, pause]);

  function selectAnswer(label) {
    if (hasAnswered) return;
    setAnswers((prev) => ({ ...prev, [q.id]: label }));
    if (label !== q.correct_option) setShakeKey((k) => k + 1);
  }

  function goNext() {
    if (isLast) { setView("results"); }
    else { setCurrentIndex((i) => i + 1); setCardKey((k) => k + 1); }
  }

  function goBack() {
    setCurrentIndex((x) => x - 1);
  }

  const progressPct = questions.length
    ? ((currentIndex + (hasAnswered ? 1 : 0)) / questions.length) * 100
    : 0;

  const breakdown = useMemo(() =>
    questions.map((question) => {
      const picked = answers[question.id];
      return { question, picked, ok: picked === question.correct_option };
    }), [answers, questions]);

  return {
    // Quiz sets
    quizSets, activeSetId, setActiveSetId, quizTitle, pageLoading,
    // Questions
    questions, view, q, currentIndex, cardKey, pickedForCurrent, hasAnswered,
    isFirst, isLast, score, progressPct, breakdown, shakeRef,
    // Timer
    mm, ss, isRunning, mode, modeLabel,
    // Actions
    startQuizPomodoro, selectAnswer, goNext, goBack, resetQuiz: resetQuizState, pause,
    // API actions
    handleGenerate, handleDeleteSet, fetchFolders,
    // Generate modal
    showGenerate, setShowGenerate, folders,
  };
}
