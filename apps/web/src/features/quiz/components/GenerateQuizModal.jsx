"use client";

import { useState } from "react";

const ACCENT = "#6366f1";

export default function GenerateQuizModal({ folders, onGenerate, onClose, accentColor }) {
  const [title, setTitle] = useState("");
  const [folderId, setFolderId] = useState("");
  const [topic, setTopic] = useState("");
  const [numQuestions, setNumQuestions] = useState(10);
  const [generating, setGenerating] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setGenerating(true);
    try {
      await onGenerate({ title, folderId, topic, numQuestions });
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => !generating && onClose()}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Generate Quiz</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Create questions from your uploaded documents.</p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Set name</label>
            <input
              type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Biology Ch. 5, Midterm Review"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Folder</label>
            <select
              value={folderId} onChange={(e) => setFolderId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All documents</option>
              {folders.map((f) => (<option key={f.id} value={f.id}>{f.name}</option>))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Topic prompt</label>
            <input
              type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Photosynthesis, Chapter 3 vocabulary"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Number of questions: {numQuestions}</label>
            <input type="range" min={3} max={30} value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))} className="w-full accent-indigo-600" />
            <div className="flex justify-between text-xs text-slate-400 mt-1"><span>3</span><span>30</span></div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} disabled={generating} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 transition-all">Cancel</button>
            <button type="submit" disabled={generating} className="flex-1 px-4 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-all hover:opacity-90" style={{ background: accentColor || ACCENT }}>
              {generating ? "Generating..." : "Generate"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
