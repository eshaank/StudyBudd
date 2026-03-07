import ProgressRing from "./ProgressRing";
import { getExplanation } from "../constants/explanations";

function ScoreGauge({ score, total }) {
  const pct = total ? Math.round((score / total) * 100) : 0;
  const color = pct >= 80 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";
  const label = pct >= 80 ? "Excellent!" : pct >= 60 ? "Good work!" : pct >= 40 ? "Keep studying" : "Needs review";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: "2rem" }}>
      <div style={{ position: "relative", display: "inline-flex" }}>
        <ProgressRing pct={pct} size={128} stroke={10} color={color} />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: "1.7rem", fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{pct}%</div>
          <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, marginTop: 2 }}>{score}/{total}</div>
        </div>
      </div>
      <div style={{ fontSize: "1rem", fontWeight: 700, color }}>{label}</div>
    </div>
  );
}

export default function ResultsView({ quiz, score, breakdown, resetQuiz }) {
  return (
    <div className="qz-results">
      <h2 className="qz-results-title">Session Complete</h2>
      <ScoreGauge score={score} total={quiz.questions.length} />

      <div>
        {breakdown.map(({ question, picked, correct, ok }, idx) => (
          <div
            key={question.id}
            className="qz-bd-item"
            style={{
              borderColor: ok ? "rgba(22,163,74,0.35)" : "rgba(220,38,38,0.35)",
              background: ok ? "rgba(22,163,74,0.07)" : "rgba(220,38,38,0.07)",
            }}
          >
            <div className="qz-bd-prompt">
              <span style={{ color: ok ? "#4ade80" : "#f87171", marginRight: 6 }}>{ok ? "\u2713" : "\u2717"}</span>
              Q{idx + 1}: {question.prompt}
            </div>
            <div className="qz-bd-ans" style={{ color: ok ? "#86efac" : "#fca5a5" }}>
              Your answer: {picked !== undefined ? question.options[picked] : <em>No answer</em>}
            </div>
            {!ok && (
              <div className="qz-bd-ans" style={{ color: "#86efac", marginTop: 3 }}>
                Correct: {question.options[correct]}
              </div>
            )}
            <div className="qz-bd-expl">{getExplanation(question, picked ?? -1)}</div>
          </div>
        ))}
      </div>

      <button type="button" className="qz-retry" onClick={resetQuiz}>
        &circlearrowleft; Retry Quiz
      </button>
    </div>
  );
}
