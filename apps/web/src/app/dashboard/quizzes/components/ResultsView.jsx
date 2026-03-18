import ProgressRing from "./ProgressRing";

function ScoreGauge({ score, total }) {
  const pct = total ? Math.round((score / total) * 100) : 0;
  const color = pct >= 80 ? "#22c55e" : pct >= 50 ? "#f59e0b" : "#ef4444";
  const label = pct >= 80 ? "Excellent!" : pct >= 60 ? "Good work!" : pct >= 40 ? "Keep studying" : "Needs review";
  return (
    <div className="flex flex-col items-center gap-2.5 mb-8">
      <div className="relative inline-flex">
        <ProgressRing pct={pct} size={120} stroke={10} color={color} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-extrabold font-mono leading-none" style={{ color }}>{pct}%</div>
          <div className="text-[0.68rem] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">{score}/{total}</div>
        </div>
      </div>
      <div className="text-sm font-bold" style={{ color }}>{label}</div>
    </div>
  );
}

export default function ResultsView({ questions, score, breakdown, resetQuiz }) {
  return (
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
                background: ok ? "rgba(22,163,74,0.06)" : "rgba(220,38,38,0.06)",
              }}
            >
              <div className="qz-bd-prompt">
                <span style={{ color: ok ? "#22c55e" : "#ef4444", marginRight: 6 }}>{ok ? "\u2713" : "\u2717"}</span>
                Q{idx + 1}: {question.question}
              </div>
              <div className="qz-bd-ans" style={{ color: ok ? "#16a34a" : "#dc2626" }}>
                Your answer: {picked ? `${picked}. ${pickedText}` : <em>No answer</em>}
              </div>
              {!ok && (
                <div className="qz-bd-ans" style={{ color: "#16a34a", marginTop: 3 }}>
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

      <button type="button" className="qz-retry" onClick={resetQuiz}>
        &#8634; Retry Quiz
      </button>
    </div>
  );
}
