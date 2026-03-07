"use client";

export default function FolderSidebar({
  folders,
  activeFolderFilter,
  setActiveFolderFilter,
  folderDocCount,
  unfiledCount,
  documentsCount,
  isNewFolderOpen,
  setIsNewFolderOpen,
  newFolderName,
  setNewFolderName,
  creatingFolder,
  onCreateFolder,
  onDeleteFolder,
  onOpenNewFolder,
}) {
  return (
    <div className="w-full lg:w-56 flex-shrink-0 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Folders</span>
        <button
          type="button"
          onClick={onOpenNewFolder}
          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-slate-100 text-slate-500 hover:text-indigo-600 transition-colors"
          title="New folder"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      <ul className="py-1">
        {/* All Files */}
        <li>
          <button
            type="button"
            onClick={() => setActiveFolderFilter("all")}
            className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeFolderFilter === "all"
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span className="flex-1 text-left">All Files</span>
            <span className="text-xs text-slate-400">{documentsCount}</span>
          </button>
        </li>

        {/* Unfiled */}
        <li>
          <button
            type="button"
            onClick={() => setActiveFolderFilter("unfiled")}
            className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeFolderFilter === "unfiled"
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <svg className="w-4 h-4 flex-shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="flex-1 text-left">Unfiled</span>
            <span className="text-xs text-slate-400">{unfiledCount}</span>
          </button>
        </li>

        {/* Divider */}
        {folders.length > 0 && <li className="mx-4 my-1 border-t border-slate-100" />}

        {/* User folders */}
        {folders.map((folder) => (
          <li key={folder.id} className="group">
            <div
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeFolderFilter === folder.id
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveFolderFilter(folder.id)}
                className="flex items-center gap-2 flex-1 min-w-0 text-left"
              >
                <svg className="w-4 h-4 flex-shrink-0 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z" />
                </svg>
                <span className="truncate">{folder.name}</span>
                <span className="text-xs text-slate-400 flex-shrink-0">{folderDocCount[folder.id] || 0}</span>
              </button>
              <button
                type="button"
                onClick={() => onDeleteFolder(folder.id)}
                className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded hover:bg-red-50 hover:text-red-500 text-slate-400 transition-all flex-shrink-0"
                title="Delete folder"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </li>
        ))}

        {/* New folder inline form */}
        {isNewFolderOpen && (
          <li className="px-3 py-2">
            <form onSubmit={onCreateFolder} className="flex gap-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name..."
                autoFocus
                className="flex-1 rounded-lg border border-indigo-300 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
                disabled={creatingFolder}
              />
              <button
                type="submit"
                disabled={!newFolderName.trim() || creatingFolder}
                className="rounded-lg bg-indigo-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {creatingFolder ? "..." : "Add"}
              </button>
              <button
                type="button"
                onClick={() => setIsNewFolderOpen(false)}
                className="rounded-lg px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-100"
              >
                Cancel
              </button>
            </form>
          </li>
        )}
      </ul>
    </div>
  );
}
