import CardNavigation from "./CardNavigation";

export default function FlashcardViewer({
  current, isFlipped, setIsFlipped, accentColor, tab,
  index, cards, progressPct, disabledPrev, disabledNext,
  flip, prev, next, goToCard,
  sources, showCardSources, setShowCardSources,
}) {
  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-slate-800 shadow-sm overflow-hidden">

      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-100 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: accentColor }}
          />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {tab === "flashcards" ? "Flashcards" : "Preview"}
          </span>
          <span className="text-slate-300 dark:text-slate-600">&middot;</span>
          <span className="text-sm text-slate-500 dark:text-slate-400 tabular-nums">
            {cards.length ? `${index + 1} of ${cards.length}` : "0 of 0"}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsFlipped(false)}
            disabled={!current}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition"
          >
            Front
          </button>
          <button
            onClick={flip}
            disabled={!current}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-40 transition hover:opacity-90"
            style={{ background: accentColor }}
          >
            Flip <kbd className="ml-1 opacity-75 font-mono">Space</kbd>
          </button>
          <button
            onClick={() => setIsFlipped(true)}
            disabled={!current}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-40 transition"
          >
            Back
          </button>
        </div>
      </div>

      {/* Card area */}
      <div className="p-5 sm:p-8">
        {!current ? (
          <div className="h-64 flex items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-600">
            <p className="text-slate-400 dark:text-slate-500 font-medium">No cards in this deck yet.</p>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-5">

            {/* 3-D flip card */}
            <div className="fc-card-wrapper relative cursor-pointer" onClick={flip}>
              <div className="fc-card-glow" style={{ "--accent": accentColor }} />

              <div className="fc-card-scene h-[340px] sm:h-[400px]">
                <div className={`fc-card-inner h-full ${isFlipped ? "flipped" : ""}`}>

                  {/* Front face */}
                  <div className="fc-card-face fc-card-front rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-md overflow-hidden">
                    <div className="fc-shine absolute inset-0 rounded-3xl pointer-events-none" />
                    <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${accentColor}, color-mix(in srgb, ${accentColor} 40%, transparent))` }} />
                    <div className="h-full flex flex-col px-8 sm:px-12 pt-7 pb-8">
                      <div className="flex items-center justify-between">
                        <span
                          className="text-[11px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full"
                          style={{ background: `color-mix(in srgb, ${accentColor} 10%, transparent)`, color: accentColor }}
                        >
                          Question
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">tap to reveal &rarr;</span>
                      </div>
                      <div className="flex-1 flex items-center justify-center py-4">
                        <p className="text-center text-2xl sm:text-[2rem] leading-snug text-slate-900 dark:text-white font-bold">
                          {current.front}
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 dark:text-slate-500">
                        <span><kbd className="font-mono font-bold text-slate-500 dark:text-slate-400">Space</kbd> to flip</span>
                        <span className="opacity-40">&middot;</span>
                        <span><kbd className="font-mono font-bold text-slate-500 dark:text-slate-400">&larr;&rarr;</kbd> to navigate</span>
                      </div>
                    </div>
                  </div>

                  {/* Back face */}
                  <div className="fc-card-face fc-card-back rounded-3xl border overflow-hidden shadow-md"
                    style={{ borderColor: `color-mix(in srgb, ${accentColor} 30%, transparent)`, background: `linear-gradient(145deg, color-mix(in srgb, ${accentColor} 6%, var(--card-bg, white)), var(--card-bg, white))` }}
                  >
                    <div className="h-1 w-full" style={{ background: accentColor }} />
                    <div className="h-full flex flex-col px-8 sm:px-12 pt-7 pb-8">
                      <div className="flex items-center justify-between">
                        <span
                          className="text-[11px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full text-white"
                          style={{ background: accentColor }}
                        >
                          Answer
                        </span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">&larr; tap to go back</span>
                      </div>
                      <div className="flex-1 flex items-center justify-center py-4">
                        <p className="text-center text-xl sm:text-2xl leading-relaxed text-slate-800 dark:text-slate-200 font-medium">
                          {current.back}
                        </p>
                      </div>
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        {showCardSources && (sources?.source_documents?.length > 0 || sources?.source_chunks?.length > 0) && (
                          <div className="mb-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm shadow-sm p-3 space-y-2 max-h-[140px] overflow-y-auto">
                            {sources.source_documents?.length > 0 && (
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Source files</p>
                                <ul className="space-y-0.5">
                                  {sources.source_documents.map((doc) => (
                                    <li key={doc.id} className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 truncate" title={doc.original_filename}>
                                      {doc.original_filename}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {sources.source_chunks?.length > 0 && (
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Supporting chunks</p>
                                <ul className="space-y-1.5">
                                  {sources.source_chunks.map((chunk, i) => {
                                    const docName = sources.source_documents?.find((d) => d.id === chunk.document_id)?.original_filename ?? "Document";
                                    return (
                                      <li key={i} className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight">
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">{docName}</span>
                                        <span className="text-slate-400 ml-1">chunk {chunk.chunk_index + 1}</span>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => setShowCardSources?.((v) => !v)}
                            className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all"
                            style={{
                              borderColor: showCardSources ? accentColor : "#e2e8f0",
                              color: showCardSources ? accentColor : "#94a3b8",
                              background: showCardSources ? `color-mix(in srgb, ${accentColor} 8%, white)` : "transparent",
                            }}
                          >
                            {showCardSources ? "Hide Sources" : "Sources"}
                          </button>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                            Can you explain this in your own words?
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            <CardNavigation
              index={index}
              cards={cards}
              accentColor={accentColor}
              progressPct={progressPct}
              disabledPrev={disabledPrev}
              disabledNext={disabledNext}
              prev={prev}
              next={next}
              goToCard={goToCard}
            />

          </div>
        )}
      </div>
    </div>
  );
}
