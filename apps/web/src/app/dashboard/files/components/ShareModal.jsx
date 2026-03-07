"use client";

export default function ShareModal({
  shareDoc,
  shareEmail,
  setShareEmail,
  shareRecipients,
  shareSuggestions,
  copyLinkDone,
  shareInputRef,
  onAddRecipient,
  onRemoveRecipient,
  onKeyDown,
  onCopyLink,
  onShare,
  onClose,
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 id="share-modal-title" className="text-lg font-bold text-slate-900">Share file</h2>
            <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{shareDoc.original_filename}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Add people */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Add people</label>
            <div
              className="flex flex-wrap items-center gap-1.5 min-h-[42px] rounded-xl border border-slate-200 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-indigo-200 focus-within:border-indigo-300 transition cursor-text"
              onClick={() => shareInputRef.current?.focus()}
            >
              {shareRecipients.map((r) => (
                <span
                  key={r.id}
                  className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-200 pl-2 pr-1 py-0.5 text-xs font-semibold text-indigo-700"
                >
                  {r.email}
                  <button
                    type="button"
                    onClick={() => onRemoveRecipient(r.id)}
                    className="ml-0.5 rounded p-0.5 hover:bg-indigo-200 text-indigo-500"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
              <input
                ref={shareInputRef}
                type="text"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={shareRecipients.length === 0 ? "Search by name or email..." : ""}
                className="flex-1 min-w-[140px] bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none"
              />
            </div>

            {/* Suggestions */}
            {shareSuggestions.length > 0 && (
              <div className="mt-1 rounded-xl border border-slate-200 bg-white shadow-lg overflow-hidden divide-y divide-slate-50 z-10 relative">
                {shareSuggestions.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => onAddRecipient(u)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition text-left"
                  >
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-[11px] font-bold text-indigo-700 shrink-0">
                      {u.name[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{u.name}</p>
                      <p className="text-xs text-slate-400 truncate">{u.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <p className="mt-1.5 text-[11px] text-slate-400">
              Press Enter to add. Use Backspace to remove last.
            </p>
          </div>

          {/* Copy link */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Copy link</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-500 truncate select-all">
                {typeof window !== "undefined"
                  ? `${window.location.origin}/dashboard/files/${shareDoc.id}`
                  : `https://studybudd.app/files/${shareDoc.id}`}
              </div>
              <button
                type="button"
                onClick={onCopyLink}
                className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  copyLinkDone
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {copyLinkDone ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onShare}
            disabled={shareRecipients.length === 0}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share{shareRecipients.length > 0 ? ` (${shareRecipients.length})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
