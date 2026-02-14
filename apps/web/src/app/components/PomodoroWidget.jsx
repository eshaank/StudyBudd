"use client";

import { useState } from "react";
import PomodorTimer from "./PomodorTimer";
import { usePomodoro } from "./PomodoroProvider";

export default function PomodoroWidget() {
  const [open, setOpen] = useState(false);
  const { hydrated, mm, ss, pad2, modeLabel, isRunning, start, pause } = usePomodoro();

  const label = hydrated ? modeLabel : "Loading...";

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <div className="w-[380px] max-w-[92vw] rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <div className="flex flex-col leading-tight min-w-0">
              <div className="font-extrabold text-slate-900">Pomodoro</div>
              <div className="text-xs text-slate-500 truncate">{label}</div>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-1 text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
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
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl hover:shadow-2xl transition"
          aria-label="Open pomodoro"
          type="button"
        >
          <div className="flex flex-col items-start leading-tight min-w-0">
            <div className="text-xs text-slate-500 truncate">{label}</div>
            <div className="text-lg font-extrabold tabular-nums text-slate-900">
              {pad2(mm)}:{pad2(ss)}
            </div>
          </div>

          {!isRunning ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                start();
              }}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
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
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
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
