"use client";

import { useEffect, useRef } from "react";
import FileIcon from "./FileIcon";
import { formatFileSize, formatDate } from "../../../../lib/format";

export default function DocumentRow({
  doc,
  folder,
  folders,
  deleting,
  assigningFolder,
  movingDoc,
  setMovingDoc,
  onShare,
  onMoveToFolder,
  onAsk,
  onDelete,
}) {
  const dropdownRef = useRef(null);
  const isMoving = movingDoc === doc.id;

  useEffect(() => {
    if (!isMoving) return;
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setMovingDoc(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isMoving, setMovingDoc]);

  return (
    <li className="group flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
      {/* File Icon */}
      <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-slate-100 rounded-lg">
        <FileIcon fileType={doc.file_type} />
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="truncate font-semibold text-slate-900">{doc.original_filename}</p>
        <div className="mt-1 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500">
            {doc.file_type?.toUpperCase()} • {formatFileSize(doc.file_size)} • {formatDate(doc.created_at)}
          </span>
          {folder && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z" />
              </svg>
              {folder.name}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 relative">
        <button
          type="button"
          onClick={() => onShare(doc)}
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100 flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share
        </button>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Move to folder */}
          <div className="relative" ref={isMoving ? dropdownRef : null}>
            <button
              type="button"
              onClick={() => setMovingDoc(isMoving ? null : doc.id)}
              disabled={assigningFolder === doc.id}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              title="Move to folder"
            >
              {assigningFolder === doc.id ? (
                <span className="inline-block w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z" />
                </svg>
              )}
            </button>

            {isMoving && (
              <div className="absolute right-0 top-full mt-1 w-48 rounded-xl border border-slate-200 bg-white shadow-xl z-20 overflow-hidden">
                <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                  Move to folder
                </div>
                <ul className="py-1 max-h-48 overflow-y-auto">
                  {doc.folder_id && (
                    <li>
                      <button
                        type="button"
                        onClick={() => onMoveToFolder(doc.id, null)}
                        className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                      >
                        Remove from folder
                      </button>
                    </li>
                  )}
                  {folders.length === 0 && (
                    <li className="px-4 py-2 text-sm text-slate-400 italic">No folders yet</li>
                  )}
                  {folders.map((f) => (
                    <li key={f.id}>
                      <button
                        type="button"
                        onClick={() => onMoveToFolder(doc.id, f.id)}
                        disabled={doc.folder_id === f.id}
                        className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                          doc.folder_id === f.id
                            ? "text-indigo-600 font-semibold bg-indigo-50"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {f.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onAsk(doc)}
            className="rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
          >
            Ask
          </button>
          <button
            type="button"
            onClick={() => onDelete(doc.id)}
            disabled={deleting === doc.id}
            className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
          >
            {deleting === doc.id ? (
              <span className="inline-block w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </li>
  );
}
