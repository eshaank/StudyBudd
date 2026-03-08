import { useEffect, useState } from "react";

export default function FeedbackPanel({ question, pickedLabel, onNext, isLast }) {
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
        border: `1.5px solid ${isCorrect ? "rgba(22,163,74,0.3)" : "rgba(220,38,38,0.3)"}`,
        background: isCorrect
          ? "linear-gradient(135deg, rgba(22,163,74,0.08) 0%, rgba(22,163,74,0.04) 100%)"
          : "linear-gradient(135deg, rgba(220,38,38,0.08) 0%, rgba(220,38,38,0.04) 100%)",
        padding: "1.25rem 1.4rem",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(14px)",
        transition: "opacity 0.35s ease, transform 0.35s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: "0.85rem" }}>
        <div
          style={{
            width: 34, height: 34, borderRadius: 10, flexShrink: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: isCorrect ? "#22c55e" : "#ef4444",
            animation: "qzPopIn 0.45s cubic-bezier(0.34,1.56,0.64,1) both",
          }}
        >
          {isCorrect
            ? <svg width="16" height="16" fill="none"><path d="M3 8l3.5 3.5L13 5" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            : <svg width="16" height="16" fill="none"><path d="M12 4L4 12M4 4l8 8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/></svg>
          }
        </div>
        <div>
          <div className="text-base font-extrabold" style={{ color: isCorrect ? "#16a34a" : "#dc2626" }}>
            {isCorrect ? "Correct!" : "Not quite"}
          </div>
          {!isCorrect && (
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Correct answer: <strong style={{ color: "#16a34a" }}>{question.correct_option}. {correctText}</strong>
            </div>
          )}
        </div>
      </div>

      {question.explanation && (
        <div
          className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 mb-3"
          style={{
            background: isCorrect ? "rgba(22,163,74,0.06)" : "rgba(220,38,38,0.06)",
            borderRadius: 10,
            padding: "0.75rem 1rem",
            borderLeft: `3px solid ${isCorrect ? "#22c55e" : "#ef4444"}`,
          }}
        >
          {question.explanation}
        </div>
      )}

      <button
        type="button" onClick={onNext}
        className="w-full py-2.5 rounded-xl border-none text-white text-sm font-bold transition-all hover:brightness-110 hover:-translate-y-0.5"
        style={{
          background: isCorrect
            ? "linear-gradient(135deg, #16a34a, #22c55e)"
            : "linear-gradient(135deg, #6366f1, #8b5cf6)",
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        {isLast ? "See My Results \u2192" : "Next Question \u2192"}
      </button>
    </div>
  );
}
