"use client";

import { useState } from "react";
import PomodorTimer from "./PomodorTimer";
import { usePomodoro } from "./PomodoroProvider";

export default function PomodoroWidget() {
  const [open, setOpen] = useState(false);
  const { hydrated, mm, ss, pad2, modeLabel, isRunning, mode, start, pause } = usePomodoro();

  const label = hydrated ? modeLabel : "...";

  const accentColor =
    mode === "focus"
      ? "text-indigo-600 dark:text-indigo-400"
      : mode === "shortBreak"
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-blue-600 dark:text-blue-400";

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <div className="w-[360px] max-w-[92vw] rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Pomodoro
              </p>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{label}</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200 transition"
              type="button"
            >
              Minimize
            </button>
          </div>

          <div className="p-4">
            <PomodorTimer />
          </div>
        </div>
      ) : (
        /* Compact floating bubble */
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 shadow-xl hover:shadow-2xl transition"
          aria-label="Open pomodoro"
          type="button"
        >
          <div className="flex flex-col items-start leading-tight min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {label}
            </div>
            <div className={`text-xl font-bold tabular-nums ${accentColor}`}>
              {pad2(mm)}:{pad2(ss)}
            </div>
          </div>

          {!isRunning ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                start();
              }}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition"
              type="button"
            >
              Start
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                pause();
              }}
              className="rounded-lg bg-slate-800 dark:bg-slate-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700 dark:hover:bg-slate-500 transition"
              type="button"
            >
              Pause
            </button>
          )}
        </button>
      )}
    </div>
  );
}
