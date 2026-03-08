export default function QuizSetSwitcher({ quizSets, activeSetId, setActiveSetId, onDelete }) {
  if (!quizSets.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {quizSets.map((s) => {
        const active = s.id === activeSetId;
        return (
          <div key={s.id} className="flex items-center gap-1">
            <button
              onClick={() => setActiveSetId(s.id)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-semibold border transition-all ${
                active
                  ? "text-white border-transparent shadow-md"
                  : "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-600"
              }`}
              style={active ? { background: "linear-gradient(135deg, #6366f1, #8b5cf6)" } : undefined}
            >
              {s.title} ({s.question_count})
            </button>
            {active && onDelete && (
              <button
                onClick={() => onDelete(s.id)}
                className="text-xs text-red-500 hover:text-red-700 font-semibold px-1"
                title="Delete set"
              >
                &times;
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
