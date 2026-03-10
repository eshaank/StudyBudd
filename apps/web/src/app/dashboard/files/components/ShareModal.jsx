"use client";

export default function ShareModal({
  shareDoc,
  shareEmail,
  setShareEmail,
  shareRecipients,
  shareSuggestions,
  copyLinkDone,
  copyLinkLoading,
  shareLink,
  isSharing,
  shareError,
  shareInputRef,
  onAddRecipient,
  onRemoveRecipient,
  onKeyDown,
  onCopyLink,
  onShare,
  onClose,
}) {
  const displayUrl =
    shareLink ||
    (typeof window !== "undefined"
      ? `${window.location.origin}/shared/…`
      : "https://studybudd.app/shared/…");

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
          {/* Error banner */}
          {shareError && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              {shareError}
            </div>
          )}

          {/* Copy link */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Copy link
              <span className="ml-2 text-[11px] font-normal text-slate-400">
                Anyone with the link can view
              </span>
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-500 truncate select-all font-mono">
                {displayUrl}
              </div>
              <button
                type="button"
                onClick={onCopyLink}
                disabled={copyLinkLoading}
                className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition flex items-center gap-1.5 ${
                  copyLinkDone
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-60"
                }`}
              >
                {copyLinkLoading ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                    Generating…
                  </>
                ) : copyLinkDone ? (
                  "Copied!"
                ) : shareLink ? (
                  "Copy"
                ) : (
                  "Generate & Copy"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
