"use client";

import { useEffect, useRef, useState } from "react";

export default function ChatInput({ onSend, isLoading }) {
  const [input, setInput] = useState("");
  const [attached, setAttached] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const fileInputRef = useRef(null);

  // Close plus-menu on outside click
  useEffect(() => {
    function onDocClick(e) {
      if (e.target?.closest?.("[data-plus-menu]")) return;
      setMenuOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  function onPickFiles(e) {
    const list = Array.from(e.target.files || []);
    if (!list.length) return;
    setAttached((prev) => [...prev, ...list].slice(0, 4));
    e.target.value = "";
    setMenuOpen(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput("");
    setAttached([]);
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-slate-100 dark:border-slate-700 p-3 bg-white dark:bg-slate-800 shrink-0">
      {/* Attachment chips */}
      {attached.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {attached.map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-3 py-1 text-xs text-slate-700 dark:text-slate-300"
            >
              <span className="truncate max-w-[150px]">{f.name}</span>
              <button
                type="button"
                onClick={() => setAttached((prev) => prev.filter((_, idx) => idx !== i))}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 items-stretch">
        {/* Plus menu */}
        <div className="relative" data-plus-menu>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="h-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
          >
            +
          </button>
          {menuOpen && (
            <div className="absolute bottom-[48px] left-0 w-64 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 shadow-xl overflow-hidden z-10">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M10 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V8a2 2 0 00-2-2h-8l-2-2z" />
                  </svg>
                  Documents auto-search enabled
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  Your uploaded files are automatically searched when you ask about your notes or study materials.
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                multiple
                onChange={onPickFiles}
              />
            </div>
          )}
        </div>

        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
          className="flex-1 rounded-xl text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 disabled:bg-slate-50 dark:disabled:bg-slate-800 transition-shadow placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />

        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Send
        </button>
      </div>
    </form>
  );
}
