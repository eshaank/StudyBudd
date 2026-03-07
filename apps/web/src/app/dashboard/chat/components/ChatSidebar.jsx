"use client";

export default function ChatSidebar({
  open,
  onClose,
  search,
  setSearch,
  filteredThreads,
  activeId,
  onSelectThread,
  // Rename
  renameId,
  renameValue,
  setRenameValue,
  onStartRename,
  onCancelRename,
  onSaveRename,
  // 3-dot menu
  threadMenuId,
  onOpenThreadMenu,
  // Delete
  onOpenDeleteConfirm,
  onCloseThreadMenu,
}) {
  return (
    <aside
      className={`
        absolute top-0 bottom-0 left-0 z-30 w-72
        flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 shadow-xl
        transition-transform duration-200 ease-in-out
        ${open ? "translate-x-0" : "-translate-x-full"}
        lg:relative lg:z-auto lg:shadow-none lg:rounded-l-2xl
        ${open ? "lg:translate-x-0" : "lg:w-0 lg:min-w-0 lg:overflow-hidden lg:-translate-x-full lg:border-r-0"}
      `}
    >
      {/* Header */}
      <div className="border-b border-slate-100 dark:border-slate-700 p-4 shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">Chat History</h2>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 dark:border-slate-600 p-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search chats..."
          className="mt-3 w-full rounded-lg text-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-shadow"
        />
      </div>

      {/* Thread list */}
      <div className="overflow-y-auto flex-1">
        {filteredThreads.length === 0 ? (
          <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-xs">No history yet.</div>
        ) : (
          <ul className="p-2 space-y-1">
            {filteredThreads.map((t) => {
              const isActive = t.id === activeId;
              const isRenaming = renameId === t.id;
              const isMenuOpen = threadMenuId === t.id;
              return (
                <li key={t.id}>
                  <div
                    className={`flex items-center gap-2 rounded-xl px-3 py-2.5 transition-colors ${
                      isActive
                        ? "bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700"
                        : "hover:bg-slate-50 dark:hover:bg-slate-700 border border-transparent"
                    }`}
                  >
                    {isRenaming ? (
                      <div className="flex-1 min-w-0 flex flex-col gap-2">
                        <input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") onSaveRename();
                            if (e.key === "Escape") onCancelRename();
                          }}
                          className="w-full rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800"
                          placeholder="Chat name"
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={onCancelRename}
                            className="rounded-lg px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={onSaveRename}
                            className="rounded-lg px-2 py-1 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => onSelectThread(t.id)}
                          className="flex-1 min-w-0 text-left"
                        >
                          <p className="font-semibold text-slate-900 dark:text-white truncate text-sm">{t.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {new Date(t.created_at || Date.now()).toLocaleDateString()}
                          </p>
                        </button>
                        <div className="relative shrink-0" data-thread-menu>
                          <button
                            onClick={(e) => onOpenThreadMenu(e, t.id)}
                            title="More actions"
                            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 focus:ring-inset"
                            aria-label="More actions"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <circle cx="12" cy="6" r="1.5" />
                              <circle cx="12" cy="12" r="1.5" />
                              <circle cx="12" cy="18" r="1.5" />
                            </svg>
                          </button>
                          {isMenuOpen && (
                            <div className="absolute right-0 top-full mt-1 z-10 w-40 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-lg py-1">
                              <button
                                type="button"
                                onClick={() => onStartRename(t.id, t.title)}
                                className="w-full px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600"
                              >
                                Rename
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  onOpenDeleteConfirm(e, t.id);
                                  onCloseThreadMenu();
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
