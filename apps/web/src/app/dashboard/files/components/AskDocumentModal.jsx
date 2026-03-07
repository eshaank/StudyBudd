"use client";

export default function AskDocumentModal({
  documentName,
  question,
  setQuestion,
  loading,
  result,
  onSubmit,
  onClose,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-bold text-slate-900">Ask about {documentName}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="query-question" className="block text-sm font-semibold text-slate-700 mb-2">
              Your question
            </label>
            <input
              id="query-question"
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What are the main topics covered?"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Searching...
              </span>
            ) : (
              "Submit"
            )}
          </button>
        </form>

        {result && (
          <div className="px-6 pb-6 space-y-4">
            {result.error ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {result.error}
              </div>
            ) : (
              <>
                <div>
                  <h3 className="text-sm font-semibold text-slate-700 mb-2">Answer</h3>
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 whitespace-pre-wrap">
                    {result.answer}
                  </div>
                </div>
                {result.context_chunks?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 mb-2">Source chunks</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {result.context_chunks.map((chunk) => (
                        <div key={chunk.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
                          <span className="text-xs font-medium text-slate-500">Chunk {chunk.chunk_index + 1}</span>
                          <p className="mt-1 line-clamp-3">{chunk.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
