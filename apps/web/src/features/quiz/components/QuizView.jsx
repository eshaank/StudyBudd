import FeedbackPanel from "./FeedbackPanel";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export default function QuizView({
  quiz, q, currentIndex, cardKey, pickedForCurrent, hasAnswered,
  isFirst, isLast, progressPct, shakeRef,
  selectAnswer, goNext, goBack,
}) {
  return (
    <>
      <div className="qz-prog-meta">
        <span>Question {currentIndex + 1} of {quiz.questions.length}</span>
        <span>{Math.round(progressPct)}%</span>
      </div>
      <div className="qz-prog-track">
        <div className="qz-prog-fill" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="qz-card" key={`qcard-${currentIndex}-${cardKey}`}>
        <div className="qz-q-num">Q{currentIndex + 1} of {quiz.questions.length}</div>
        <p className="qz-q-text">{q.prompt}</p>

        <div className="qz-opts" ref={shakeRef}>
          {q.options.map((opt, i) => {
            const isPicked = pickedForCurrent === i;
            const isCorrect = i === q.correctIndex;
            let cls = "qz-opt";
            if (hasAnswered) {
              cls += " qz-locked";
              if (isCorrect)      cls += " qz-correct";
              else if (isPicked)  cls += " qz-wrong";
              else                cls += " qz-dim";
            }
            return (
              <button key={`${q.id}-${i}`} type="button" className={cls} onClick={() => selectAnswer(i)}>
                <span className="qz-opt-ltr">{LETTERS[i] ?? i + 1}</span>
                {opt}
              </button>
            );
          })}
        </div>

        {hasAnswered && (
          <FeedbackPanel
            key={`fb-${currentIndex}-${cardKey}`}
            question={q}
            pickedIndex={pickedForCurrent}
            onNext={goNext}
            isLast={isLast}
          />
        )}
      </div>

      {!hasAnswered && (
        <button
          type="button"
          className="qz-back-btn"
          disabled={isFirst}
          onClick={goBack}
        >
          &larr; Previous
        </button>
      )}
    </>
  );
}
