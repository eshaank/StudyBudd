"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createSupabaseBrowser } from "../../../lib/supabase/client";
import { usePomodoro } from "../../components/PomodoroProvider";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getAccessToken() {
  const supabase = createSupabaseBrowser();
  const { data: { session } } = await supabase.auth.getSession();
  const isDev = process.env.NODE_ENV === "development";
  return session?.access_token || (isDev ? "dev-token" : null);
}

// --- Shake hook ---
function useShake(trigger) {
  const ref = useRef(null);
  useEffect(() => {
    if (!trigger || !ref.current) return;
    ref.current.classList.remove("qz-shake");
    void ref.current.offsetWidth;
    ref.current.classList.add("qz-shake");
    const t = setTimeout(() => ref.current?.classList.remove("qz-shake"), 600);
    return () => clearTimeout(t);
  }, [trigger]);
  return ref;
}

// --- Progress Ring ---
function ProgressRing({ pct, size = 120, stroke = 10, color = "#3b82f6" }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(1, pct / 100));
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)" }}
      />
    </svg>
  );
}

// --- Feedback Panel ---
function FeedbackPanel({ question, pickedLabel, onNext, isLast }) {
  const isCorrect = pickedLabel === question.correct_option;
  const correctText = question.options.find((o) => o.label === question.correct_option)?.text || "";
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 40);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        marginTop: "1.25rem", borderRadius: 16,
        border: `1.5px solid ${isCorrect ? "#166534" : "#991b1b"}`,
        background: isCorrect
          ? "linear-gradient(135deg, rgba(20,83,45,0.6) 0%, rgba(21,128,61,0.4) 100%)"
          : "linear-gradient(135deg, rgba(127,29,29,0.6) 0%, rgba(153,27,27,0.4) 100%)",
        padding: "1.25rem 1.4rem",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(14px)",
        transition: "opacity 0.35s ease, transform 0.35s ease",
        backdropFilter: "blur(8px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: "0.85rem" }}>
        <div
          style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: isCorrect ? "#22c55e" : "#ef4444",
            animation: "qzPopIn 0.45s cubic-bezier(0.34,1.56,0.64,1) both",
          }}
        >
          {isCorrect
            ? <svg width="18" height="18" fill="none"><path d="M3 9l4 4 8-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            : <svg width="18" height="18" fill="none"><path d="M14 4L4 14M4 4l10 10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/></svg>
          }
        </div>
        <div>
          <div style={{ fontSize: "1rem", fontWeight: 800, color: isCorrect ? "#4ade80" : "#f87171" }}>
            {isCorrect ? "Correct!" : "Not quite"}
          </div>
          {!isCorrect && (
            <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: 2 }}>
              Correct answer: <strong style={{ color: "#86efac" }}>{question.correct_option}. {correctText}</strong>
            </div>
          )}
        </div>
      </div>

      {question.explanation && (
        <div
          style={{
            fontSize: "0.875rem", lineHeight: 1.7, color: "#cbd5e1",
            background: "rgba(0,0,0,0.25)", borderRadius: 10,
            padding: "0.75rem 1rem", marginBottom: "0.85rem",
            borderLeft: `3px solid ${isCorrect ? "#22c55e" : "#ef4444"}`,
          }}
        >
          {question.explanation}
        </div>
      )}

      <button
        type="button" onClick={onNext}
        style={{
          width: "100%", padding: "0.75rem 1rem", borderRadius: 12,
          border: "none", color: "#fff", fontSize: "0.9rem", fontWeight: 700,
          fontFamily: "Sora, sans-serif", cursor: "pointer",
          background: isCorrect ? "#16a34a" : "#2563eb",
          transition: "all 0.2s",
        }}
        onMouseEnter={e => { e.currentTarget.style.filter = "brightness(1.1)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
        onMouseLeave={e => { e.currentTarget.style.filter = ""; e.currentTarget.style.transform = ""; }}
      >
        {isLast ? "See My Results →" : "Next Question →"}
      </button>
    </div>
  );
}

// --- Score Gauge ---
function ScoreGauge({ score, total }) {
  const pct = total ? Math.round((score / total) * 100) : 0;
  const color = pct >= 80 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";
  const label = pct >= 80 ? "Excellent!" : pct >= 60 ? "Good work!" : pct >= 40 ? "Keep studying" : "Needs review";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: "2rem" }}>
      <div style={{ position: "relative", display: "inline-flex" }}>
        <ProgressRing pct={pct} size={128} stroke={10} color={color} />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: "1.7rem", fontWeight: 800, color, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{pct}%</div>
          <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, marginTop: 2 }}>{score}/{total}</div>
        </div>
      </div>
      <div style={{ fontSize: "1rem", fontWeight: 700, color }}>{label}</div>
    </div>
  );
}

// --- Main Component ---
export default function QuizzesPage() {
  // Quiz set management
  const [quizSets, setQuizSets] = useState([]);
  const [activeSetId, setActiveSetId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [quizTitle, setQuizTitle] = useState("Quiz");
  const [pageLoading, setPageLoading] = useState(true);

  // Generate modal
  const [showGenerate, setShowGenerate] = useState(false);
  const [folders, setFolders] = useState([]);
  const [genFolderId, setGenFolderId] = useState("");
  const [genTopic, setGenTopic] = useState("");
  const [genNumQuestions, setGenNumQuestions] = useState(10);
  const [generating, setGenerating] = useState(false);

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

  async function handleGenerate(e) {
    e.preventDefault();
    setGenerating(true);
    try {
      const token = await getAccessToken();
      const body = { num_questions: genNumQuestions };
      if (genFolderId) body.folder_id = genFolderId;
      if (genTopic.trim()) body.topic = genTopic.trim();

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
      setShowGenerate(false);
      setGenTopic("");
      setGenFolderId("");
      setGenNumQuestions(10);
      await fetchQuizSets();
      setActiveSetId(newSet.id);
    } catch (err) {
      alert(err.message);
    } finally {
      setGenerating(false);
    }
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

  const progressPct = questions.length
    ? ((currentIndex + (hasAnswered ? 1 : 0)) / questions.length) * 100
    : 0;

  const breakdown = useMemo(() =>
    questions.map((question) => {
      const picked = answers[question.id];
      return {
        question,
        picked,
        ok: picked === question.correct_option,
      };
    }), [answers, questions]);

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

        .qz-root {
          font-family: 'Sora', sans-serif;
          min-height: 100vh;
          background: #0a0c12;
          background-image:
            radial-gradient(ellipse 90% 60% at 15% 0%,   rgba(59,130,246,0.13) 0%, transparent 65%),
            radial-gradient(ellipse 70% 50% at 85% 100%, rgba(139,92,246,0.11) 0%, transparent 60%);
          padding: 2rem 1rem 5rem;
          color: #f1f5f9;
        }
        .qz-wrap { max-width: 680px; margin: 0 auto; }
        .qz-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; }
        .qz-title { font-size: clamp(1.4rem, 5vw, 2rem); font-weight: 800; color: #f8fafc; letter-spacing: -0.03em; line-height: 1.15; }
        .qz-subtitle { font-size: 0.78rem; color: #475569; margin-top: 4px; font-weight: 500; }

        .qz-timer {
          background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09);
          border-radius: 16px; padding: 0.85rem 1.1rem; text-align: right; min-width: 165px;
        }
        .qz-timer-mode { font-size: 0.65rem; color: #475569; font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em; }
        .qz-timer-digits { font-family: 'JetBrains Mono', monospace; font-size: 2rem; font-weight: 600; color: #e2e8f0; line-height: 1.1; }
        .qz-timer-btns { display: flex; gap: 6px; margin-top: 8px; justify-content: flex-end; }
        .qz-tbtn {
          font-size: 0.68rem; font-weight: 700; padding: 4px 10px; border-radius: 8px;
          border: none; cursor: pointer; font-family: 'Sora', sans-serif; transition: all 0.15s ease;
        }
        .qz-tbtn:hover { filter: brightness(1.15); transform: translateY(-1px); }
        .qz-tbtn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }

        .qz-prog-meta { display: flex; justify-content: space-between; font-size: 0.72rem; color: #475569; font-weight: 600; margin-bottom: 8px; }
        .qz-prog-track { height: 3px; background: rgba(255,255,255,0.07); border-radius: 99px; overflow: hidden; margin-bottom: 1.75rem; }
        .qz-prog-fill { height: 100%; border-radius: 99px; background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%); transition: width 0.55s cubic-bezier(0.4,0,0.2,1); }

        .qz-card {
          background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 22px; padding: 1.75rem 1.75rem 1.5rem;
          animation: slideUp 0.42s cubic-bezier(0.34,1.4,0.64,1) both;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(22px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .qz-q-num { font-size: 0.65rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #3b82f6; margin-bottom: 0.65rem; }
        .qz-q-text { font-size: clamp(0.95rem, 2.5vw, 1.15rem); font-weight: 700; color: #f1f5f9; line-height: 1.55; margin-bottom: 1.5rem; }

        .qz-opts { display: flex; flex-direction: column; gap: 9px; }
        .qz-opt {
          position: relative; width: 100%; text-align: left;
          padding: 0.8rem 1rem 0.8rem 3rem;
          border-radius: 13px; border: 1.5px solid rgba(255,255,255,0.09);
          background: rgba(255,255,255,0.03); color: #94a3b8;
          font-size: 0.88rem; font-weight: 500; font-family: 'Sora', sans-serif;
          cursor: pointer; transition: all 0.2s ease;
          animation: optIn 0.3s ease both;
        }
        .qz-opt:nth-child(1){ animation-delay:0.05s; }
        .qz-opt:nth-child(2){ animation-delay:0.10s; }
        .qz-opt:nth-child(3){ animation-delay:0.15s; }
        .qz-opt:nth-child(4){ animation-delay:0.20s; }
        @keyframes optIn {
          from { opacity:0; transform: translateX(-10px); }
          to   { opacity:1; transform: translateX(0); }
        }

        .qz-opt:not(.qz-locked):hover { border-color: rgba(59,130,246,0.55); background: rgba(59,130,246,0.07); color: #e2e8f0; transform: translateX(4px); }
        .qz-opt.qz-locked { cursor: default; }
        .qz-opt.qz-correct { border-color: #16a34a !important; background: rgba(22,163,74,0.12) !important; color: #86efac !important; }
        .qz-opt.qz-wrong   { border-color: #dc2626 !important; background: rgba(220,38,38,0.12) !important; color: #fca5a5 !important; }
        .qz-opt.qz-dim     { opacity: 0.3; }

        .qz-opt-ltr {
          position: absolute; left: 11px; top: 50%; transform: translateY(-50%);
          width: 25px; height: 25px; border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.68rem; font-weight: 800; font-family: 'JetBrains Mono', monospace;
          background: rgba(255,255,255,0.06); color: #475569; transition: all 0.2s;
        }
        .qz-opt.qz-correct .qz-opt-ltr { background: #22c55e; color: #fff; }
        .qz-opt.qz-wrong   .qz-opt-ltr { background: #ef4444; color: #fff; }
        .qz-opt:not(.qz-locked):hover .qz-opt-ltr { background: #3b82f6; color: #fff; }

        @keyframes qzShake { 0%,100%{transform:translateX(0)} 15%{transform:translateX(-8px)} 30%{transform:translateX(7px)} 45%{transform:translateX(-5px)} 60%{transform:translateX(4px)} 75%{transform:translateX(-3px)} 90%{transform:translateX(2px)} }
        .qz-shake { animation: qzShake 0.55s cubic-bezier(0.36,0.07,0.19,0.97) both; }
        @keyframes qzPopIn { from{transform:scale(0);opacity:0} to{transform:scale(1);opacity:1} }

        .qz-results {
          background: rgba(255,255,255,0.025); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 22px; padding: 2rem;
          animation: slideUp 0.42s cubic-bezier(0.34,1.4,0.64,1) both;
        }
        .qz-results-title { font-size: 1.5rem; font-weight: 800; color: #f8fafc; margin-bottom: 1.5rem; }

        .qz-bd-item { border-radius: 13px; border: 1.5px solid; padding: 0.85rem 1rem; }
        .qz-bd-item + .qz-bd-item { margin-top: 8px; }
        .qz-bd-prompt { font-size: 0.83rem; font-weight: 700; color: #f1f5f9; margin-bottom: 5px; }
        .qz-bd-ans { font-size: 0.78rem; font-weight: 500; }
        .qz-bd-expl { font-size: 0.75rem; color: #64748b; margin-top: 7px; line-height: 1.6; padding-top: 7px; border-top: 1px solid rgba(255,255,255,0.06); }

        .qz-retry {
          width: 100%; margin-top: 1.5rem; padding: 0.9rem; border-radius: 14px; border: none;
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
          color: #fff; font-size: 0.95rem; font-weight: 700; font-family: 'Sora', sans-serif;
          cursor: pointer; transition: all 0.2s;
        }
        .qz-retry:hover { filter: brightness(1.1); transform: translateY(-1px); box-shadow: 0 8px 28px rgba(99,102,241,0.35); }

        .qz-back-btn {
          margin-top: 1rem; font-family: 'Sora', sans-serif; font-size: 0.8rem; font-weight: 600;
          padding: 7px 15px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.09);
          background: rgba(255,255,255,0.04); color: #64748b; cursor: pointer; transition: all 0.15s;
        }
        .qz-back-btn:hover:not(:disabled) { background: rgba(255,255,255,0.07); color: #94a3b8; }
        .qz-back-btn:disabled { opacity: 0.3; cursor: not-allowed; }

        .qz-set-pill {
          padding: 6px 14px; border-radius: 10px; border: 1px solid rgba(255,255,255,0.1);
          background: rgba(255,255,255,0.04); color: #94a3b8;
          font-size: 0.78rem; font-weight: 600; cursor: pointer; transition: all 0.15s;
          font-family: 'Sora', sans-serif;
        }
        .qz-set-pill:hover { background: rgba(255,255,255,0.08); color: #e2e8f0; }
        .qz-set-pill.active { background: rgba(59,130,246,0.2); border-color: #3b82f6; color: #93c5fd; }

        @media (max-width: 500px) {
          .qz-timer { min-width: unset; width: 100%; text-align: left; }
          .qz-timer-btns { justify-content: flex-start; }
          .qz-card { padding: 1.2rem; }
        }
      `}</style>

      <div className="qz-root">
        <div className="qz-wrap">

          {/* Header */}
          <div className="qz-header">
            <div>
              <h1 className="qz-title">{quizTitle}</h1>
              <p className="qz-subtitle">
                {view === "quiz" && questions.length
                  ? `${questions.length} questions · answer to unlock explanation`
                  : view === "results"
                  ? "Session complete · review your answers below"
                  : "Generate a quiz from your documents"}
              </p>

              {/* Set switcher */}
              {quizSets.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                  {quizSets.map((s) => (
                    <button
                      key={s.id}
                      className={`qz-set-pill ${s.id === activeSetId ? "active" : ""}`}
                      onClick={() => setActiveSetId(s.id)}
                    >
                      {s.title} ({s.question_count})
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  className="qz-tbtn"
                  style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)", color: "#fff", padding: "6px 14px", borderRadius: 10 }}
                  onClick={() => { fetchFolders(); setShowGenerate(true); }}
                >
                  + Generate
                </button>
                {activeSetId && (
                  <button
                    className="qz-tbtn"
                    style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", padding: "6px 14px", borderRadius: 10, border: "1px solid rgba(239,68,68,0.3)" }}
                    onClick={() => handleDeleteSet(activeSetId)}
                  >
                    Delete
                  </button>
                )}
              </div>

              {/* Timer */}
              <div className="qz-timer">
                <div className="qz-timer-mode">{modeLabel}</div>
                <div className="qz-timer-digits">
                  {String(mm).padStart(2, "0")}:{String(ss).padStart(2, "0")}
                </div>
                <div className="qz-timer-btns">
                  <button type="button" className="qz-tbtn" style={{ background: "#1d4ed8", color: "#fff" }} onClick={startQuizPomodoro} disabled={isRunning && mode === "focus"}>
                    Focus 25m
                  </button>
                  <button type="button" className="qz-tbtn" style={{ background: "rgba(255,255,255,0.07)", color: "#64748b" }} onClick={pause}>
                    Pause
                  </button>
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
                style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)", color: "#fff", padding: "10px 24px", borderRadius: 12, fontSize: "0.85rem" }}
                onClick={() => { fetchFolders(); setShowGenerate(true); }}
              >
                + Generate Quiz
              </button>
            </div>
          )}

          {/* Quiz view */}
          {view === "quiz" && q && (
            <>
              <div className="qz-prog-meta">
                <span>Question {currentIndex + 1} of {questions.length}</span>
                <span>{Math.round(progressPct)}%</span>
              </div>
              <div className="qz-prog-track">
                <div className="qz-prog-fill" style={{ width: `${progressPct}%` }} />
              </div>

              <div className="qz-card" key={`qcard-${currentIndex}-${cardKey}`}>
                <div className="qz-q-num">Q{currentIndex + 1} of {questions.length}</div>
                <p className="qz-q-text">{q.question}</p>

                <div className="qz-opts" ref={shakeRef}>
                  {(q.options || []).map((opt) => {
                    const isPicked = pickedForCurrent === opt.label;
                    const isCorrect = opt.label === q.correct_option;
                    let cls = "qz-opt";
                    if (hasAnswered) {
                      cls += " qz-locked";
                      if (isCorrect)     cls += " qz-correct";
                      else if (isPicked) cls += " qz-wrong";
                      else               cls += " qz-dim";
                    }
                    return (
                      <button key={opt.label} type="button" className={cls} onClick={() => selectAnswer(opt.label)}>
                        <span className="qz-opt-ltr">{opt.label}</span>
                        {opt.text}
                      </button>
                    );
                  })}
                </div>

                {hasAnswered && (
                  <FeedbackPanel
                    key={`fb-${currentIndex}-${cardKey}`}
                    question={q}
                    pickedLabel={pickedForCurrent}
                    onNext={goNext}
                    isLast={isLast}
                  />
                )}
              </div>

              {!hasAnswered && (
                <button type="button" className="qz-back-btn" disabled={isFirst} onClick={() => setCurrentIndex((x) => x - 1)}>
                  ← Previous
                </button>
              )}
            </>
          )}

          {/* Results view */}
          {view === "results" && (
            <div className="qz-results">
              <h2 className="qz-results-title">Session Complete</h2>
              <ScoreGauge score={score} total={questions.length} />

              <div>
                {breakdown.map(({ question, picked, ok }, idx) => {
                  const pickedText = question.options.find((o) => o.label === picked)?.text || "No answer";
                  const correctText = question.options.find((o) => o.label === question.correct_option)?.text || "";
                  return (
                    <div
                      key={question.id}
                      className="qz-bd-item"
                      style={{
                        borderColor: ok ? "rgba(22,163,74,0.35)" : "rgba(220,38,38,0.35)",
                        background: ok ? "rgba(22,163,74,0.07)" : "rgba(220,38,38,0.07)",
                      }}
                    >
                      <div className="qz-bd-prompt">
                        <span style={{ color: ok ? "#4ade80" : "#f87171", marginRight: 6 }}>{ok ? "✓" : "✗"}</span>
                        Q{idx + 1}: {question.question}
                      </div>
                      <div className="qz-bd-ans" style={{ color: ok ? "#86efac" : "#fca5a5" }}>
                        Your answer: {picked ? `${picked}. ${pickedText}` : <em>No answer</em>}
                      </div>
                      {!ok && (
                        <div className="qz-bd-ans" style={{ color: "#86efac", marginTop: 3 }}>
                          Correct: {question.correct_option}. {correctText}
                        </div>
                      )}
                      {question.explanation && (
                        <div className="qz-bd-expl">{question.explanation}</div>
                      )}
                    </div>
                  );
                })}
              </div>

              <button type="button" className="qz-retry" onClick={resetQuizState}>
                ↺ Retry Quiz
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Generate Modal */}
      {showGenerate && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          onClick={() => !generating && setShowGenerate(false)}
        >
          <div
            style={{ background: "#1e2030", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)", width: "100%", maxWidth: 440, margin: "0 16px", overflow: "hidden" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#f8fafc" }}>Generate Quiz</h2>
              <p style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 4 }}>Create questions from your uploaded documents.</p>
            </div>

            <form onSubmit={handleGenerate} style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>Folder (optional)</label>
                <select
                  value={genFolderId}
                  onChange={(e) => setGenFolderId(e.target.value)}
                  style={{ width: "100%", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#e2e8f0", padding: "10px 12px", fontSize: "0.85rem", fontFamily: "Sora, sans-serif" }}
                >
                  <option value="">All documents</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>Prompt the agent to generate quizzes on:</label>
                <input
                  type="text"
                  value={genTopic}
                  onChange={(e) => setGenTopic(e.target.value)}
                  placeholder="e.g. Photosynthesis, Chapter 3"
                  style={{ width: "100%", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", color: "#e2e8f0", padding: "10px 12px", fontSize: "0.85rem", fontFamily: "Sora, sans-serif" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#94a3b8", marginBottom: 6 }}>Questions: {genNumQuestions}</label>
                <input
                  type="range" min={3} max={30} value={genNumQuestions}
                  onChange={(e) => setGenNumQuestions(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#3b82f6" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "#475569", marginTop: 4 }}>
                  <span>3</span><span>30</span>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setShowGenerate(false)}
                  disabled={generating}
                  className="qz-tbtn"
                  style={{ flex: 1, padding: "10px", borderRadius: 12, background: "rgba(255,255,255,0.06)", color: "#94a3b8", fontSize: "0.85rem", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="qz-tbtn"
                  style={{ flex: 1, padding: "10px", borderRadius: 12, background: "linear-gradient(135deg, #2563eb, #7c3aed)", color: "#fff", fontSize: "0.85rem", opacity: generating ? 0.5 : 1 }}
                >
                  {generating ? "Generating..." : "Generate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
