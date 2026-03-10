"use client";

import { useEffect, useMemo, useState } from "react";
import { usePomodoro } from "./PomodoroProvider";

const ChevronIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

export default function PomodoroTimer() {
  const {
    hydrated,
    studyMinutes,
    shortBreakMinutes,
    longBreakMinutes,
    longBreakEvery,
    mode,
    modeLabel,
    isRunning,
    cycleCount,
    mm,
    ss,
    applySettings,
    start,
    pause,
    resetTimer,
    resetAll,
    switchMode,
    pad2,
  } = usePomodoro();

  const [showEditTimes, setShowEditTimes] = useState(false);
  const [draft, setDraft] = useState({
    studyMinutes,
    shortBreakMinutes,
    longBreakMinutes,
    longBreakEvery,
  });

  const label = hydrated ? modeLabel : "Loading...";

  const accentColor =
    mode === "focus"
      ? "text-indigo-600 dark:text-indigo-400"
      : mode === "shortBreak"
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-blue-600 dark:text-blue-400";

  useEffect(() => {
    if (!showEditTimes) return;
    setDraft({
      studyMinutes,
      shortBreakMinutes,
      longBreakMinutes,
      longBreakEvery,
    });
  }, [showEditTimes, studyMinutes, shortBreakMinutes, longBreakMinutes, longBreakEvery]);

  const isDirty = useMemo(
    () =>
      draft.studyMinutes !== studyMinutes ||
      draft.shortBreakMinutes !== shortBreakMinutes ||
      draft.longBreakMinutes !== longBreakMinutes ||
      draft.longBreakEvery !== longBreakEvery,
    [draft, studyMinutes, shortBreakMinutes, longBreakMinutes, longBreakEvery]
  );

  function updateDraft(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handleConfirm() {
    applySettings(draft);
    setShowEditTimes(false);
  }

  return (
    <div className="w-full space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Pomodoro
          </p>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-0.5">{label}</p>
        </div>
        <span className="text-xs text-slate-400 dark:text-slate-500">
          {cycleCount} {cycleCount === 1 ? "session" : "sessions"}
        </span>
      </div>

      {/* Timer display */}
      <div className="flex items-center justify-center py-4">
        <div className={`text-6xl font-bold tabular-nums ${accentColor}`}>
          {pad2(mm)}:{pad2(ss)}
        </div>
      </div>

      {/* Mode tabs */}
      <div className="grid grid-cols-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <ModeBtn
          active={mode === "focus"}
          activeClass="bg-indigo-600 text-white"
          onClick={() => switchMode("focus")}
        >
          Focus
        </ModeBtn>
        <ModeBtn
          active={mode === "shortBreak"}
          activeClass="bg-emerald-600 text-white"
          onClick={() => switchMode("shortBreak")}
        >
          Short
        </ModeBtn>
        <ModeBtn
          active={mode === "longBreak"}
          activeClass="bg-blue-600 text-white"
          onClick={() => switchMode("longBreak")}
        >
          Long
        </ModeBtn>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {!isRunning ? (
          <button
            onClick={start}
            className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition"
            type="button"
          >
            Start
          </button>
        ) : (
          <button
            onClick={pause}
            className="flex-1 rounded-xl bg-slate-800 dark:bg-slate-600 py-2.5 text-sm font-bold text-white hover:bg-slate-700 dark:hover:bg-slate-500 transition"
            type="button"
          >
            Pause
          </button>
        )}
        <button
          onClick={resetTimer}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          type="button"
        >
          Reset
        </button>
        <button
          onClick={resetAll}
          className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          type="button"
        >
          Reset All
        </button>
      </div>

      {/* Edit times collapsible */}
      <div className="border-t border-slate-100 dark:border-slate-700 pt-3">
        <button
          onClick={() => setShowEditTimes((v) => !v)}
          className="flex w-full items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition"
          type="button"
        >
          <span>Edit Times</span>
          <ChevronIcon
            className={`w-4 h-4 transition-transform duration-200 ${
              showEditTimes ? "rotate-180" : ""
            }`}
          />
        </button>

        {showEditTimes && (
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <TimeInput
                label="Focus"
                suffix="min"
                value={draft.studyMinutes}
                min={1}
                max={180}
                disabled={isRunning}
                onChange={(value) => updateDraft("studyMinutes", value)}
              />
              <TimeInput
                label="Short break"
                suffix="min"
                value={draft.shortBreakMinutes}
                min={1}
                max={60}
                disabled={isRunning}
                onChange={(value) => updateDraft("shortBreakMinutes", value)}
              />
              <TimeInput
                label="Long break"
                suffix="min"
                value={draft.longBreakMinutes}
                min={1}
                max={90}
                disabled={isRunning}
                onChange={(value) => updateDraft("longBreakMinutes", value)}
              />
              <TimeInput
                label="Every"
                suffix="sessions"
                value={draft.longBreakEvery}
                min={2}
                max={10}
                disabled={isRunning}
                onChange={(value) => updateDraft("longBreakEvery", value)}
              />
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={isRunning || !isDirty}
              className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Confirm changes
            </button>
          </div>
        )}
        {isRunning && showEditTimes && (
          <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">Pause timer to edit times.</p>
        )}
      </div>
    </div>
  );
}

function ModeBtn({ active, activeClass, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={[
        "py-2 text-sm font-bold transition",
        active ? activeClass : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700",
      ].join(" ")}
      type="button"
    >
      {children}
    </button>
  );
}

function TimeInput({ label, suffix, value, onChange, min, max, disabled }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3">
      <div className="text-xs font-bold text-slate-500 dark:text-slate-400">{label}</div>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 disabled:opacity-50"
      />
      <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{suffix}</div>
    </div>
  );
}
