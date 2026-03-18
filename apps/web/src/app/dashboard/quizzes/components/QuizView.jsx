import FeedbackPanel from "./FeedbackPanel";

export default function QuizView({
  questions, q, currentIndex, cardKey, pickedForCurrent, hasAnswered,
  isFirst, isLast, progressPct, shakeRef,
  selectAnswer, goNext, goBack,
}) {
  return (
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
        <button
          type="button"
          disabled={isFirst}
          onClick={goBack}
          className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm border transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-600"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Previous
        </button>
      )}
    </>
  );
}
