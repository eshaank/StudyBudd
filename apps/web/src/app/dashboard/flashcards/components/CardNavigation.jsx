export default function CardNavigation({ index, cards, accentColor, progressPct, disabledPrev, disabledNext, prev, next, goToCard }) {
  return (
    <>
      <div className="flex items-center gap-4">
        <button
          onClick={prev}
          disabled={disabledPrev}
          className="fc-nav-btn flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm border transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Prev
        </button>

        {/* Progress */}
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
            <div
              className="fc-progress-fill h-full rounded-full"
              style={{ width: `${progressPct}%`, background: accentColor }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 dark:text-slate-500 tabular-nums">
            <span>{index + 1}</span>
            <span>{cards.length}</span>
          </div>
        </div>

        <button
          onClick={next}
          disabled={disabledNext}
          className="fc-nav-btn flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90"
          style={{ background: disabledNext ? "#cbd5e1" : accentColor }}
        >
          Next
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 2l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center justify-center gap-1.5 pt-1">
        {cards.map((_, i) => (
          <button
            key={i}
            onClick={() => goToCard(i)}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === index ? "20px" : "6px",
              height: "6px",
              background: i === index ? accentColor : "rgb(203 213 225)",
            }}
            aria-label={`Go to card ${i + 1}`}
          />
        ))}
      </div>
    </>
  );
}
