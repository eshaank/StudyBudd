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
      ? "text-indigo-600"
      : mode === "shortBreak"
      ? "text-emerald-600"
      : "text-blue-600";

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <div className="w-[360px] max-w-[92vw] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Pomodoro
              </p>
              <p className="text-sm font-bold text-slate-700">{label}</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
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
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl hover:shadow-2xl transition"
          aria-label="Open pomodoro"
          type="button"
        >
          <div className="flex flex-col items-start leading-tight min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
              {label}
            </div>
            <div className={`text-xl font-extrabold tabular-nums ${accentColor}`}>
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
              className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700 transition"
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
