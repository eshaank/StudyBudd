"use client";

import { usePomodoro } from "./PomodoroProvider";

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
    ringPercent,

    setStudyMinutes,
    setShortBreakMinutes,
    setLongBreakMinutes,
    setLongBreakEvery,

    start,
    pause,
    resetTimer,
    resetAll,
    switchMode,
    pad2,
  } = usePomodoro();

  const label = hydrated ? modeLabel : "Loading...";

  return (
    <div className="w-full">
      <div className="rounded-2xl bg-white shadow-xl border border-slate-100 p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-slate-500">Mode</p>
            <h3 className="text-xl font-extrabold text-slate-900 truncate">{label}</h3>
            <p className="text-sm text-slate-500 mt-1">
              Completed focus sessions:{" "}
              <span className="font-semibold text-slate-900">{cycleCount}</span>
            </p>
          </div>

          <div className="text-right shrink-0">
            <p className="text-sm text-slate-500">Progress</p>
            <p className="text-lg font-extrabold text-slate-900">{ringPercent}%</p>
          </div>
        </div>

        {/* Mode segmented control */}
        <div className="mt-4 grid grid-cols-3 rounded-xl border border-slate-200 bg-white overflow-hidden">
          <Seg active={mode === "focus"} onClick={() => switchMode("focus")}>
            Focus
          </Seg>
          <Seg active={mode === "shortBreak"} onClick={() => switchMode("shortBreak")}>
            Short
          </Seg>
          <Seg active={mode === "longBreak"} onClick={() => switchMode("longBreak")}>
            Long
          </Seg>
        </div>

        {/* Timer */}
        <div className="mt-6 flex items-center justify-center">
          <div className="relative w-48 h-48 rounded-full border-8 border-slate-200 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-8 border-indigo-500/30" />
            <div className="text-center">
              <div className="text-5xl font-extrabold text-slate-900 tabular-nums">
                {pad2(mm)}:{pad2(ss)}
              </div>
              <div className="text-sm text-slate-500 mt-1">
                {isRunning ? "Running" : "Paused"}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap gap-2">
          {!isRunning ? (
            <button
              onClick={start}
              className="flex-1 min-w-[120px] rounded-xl bg-indigo-600 px-4 py-3 text-white font-bold hover:bg-indigo-700
                focus:outline-none focus:ring-2 focus:ring-indigo-200"
              type="button"
            >
              Start
            </button>
          ) : (
            <button
              onClick={pause}
              className="flex-1 min-w-[120px] rounded-xl bg-slate-900 px-4 py-3 text-white font-bold hover:bg-slate-800
                focus:outline-none focus:ring-2 focus:ring-slate-300"
              type="button"
            >
              Pause
            </button>
          )}

          <button
            onClick={resetTimer}
            className="flex-1 min-w-[120px] rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 font-bold hover:bg-slate-50
              focus:outline-none focus:ring-2 focus:ring-indigo-200"
            type="button"
          >
            Reset
          </button>

          <button
            onClick={resetAll}
            className="flex-1 min-w-[120px] rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 font-bold hover:bg-slate-50
              focus:outline-none focus:ring-2 focus:ring-indigo-200"
            type="button"
          >
            Reset All
          </button>
        </div>

        {/* Settings */}
        <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Setting
            label="Study (min)"
            value={studyMinutes}
            min={1}
            max={180}
            onChange={setStudyMinutes}
            disabled={isRunning}
          />
          <Setting
            label="Short break (min)"
            value={shortBreakMinutes}
            min={1}
            max={60}
            onChange={setShortBreakMinutes}
            disabled={isRunning}
          />
          <Setting
            label="Long break (min)"
            value={longBreakMinutes}
            min={1}
            max={90}
            onChange={setLongBreakMinutes}
            disabled={isRunning}
          />
          <Setting
            label="Long break every"
            value={longBreakEvery}
            min={2}
            max={10}
            onChange={setLongBreakEvery}
            disabled={isRunning}
            suffix="sessions"
          />
        </div>

        <p className="mt-4 text-xs text-slate-500">
          Tip: You can edit durations while paused. Editing is locked while running.
        </p>
      </div>
    </div>
  );
}

function Seg({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-3 py-2 text-sm font-extrabold transition",
        active ? "bg-indigo-600 text-white" : "bg-white text-slate-700 hover:bg-slate-50",
      ].join(" ")}
      type="button"
    >
      {children}
    </button>
  );
}

function Setting({ label, value, onChange, min, max, disabled, suffix }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        {suffix ? <span className="text-xs text-slate-500">{suffix}</span> : null}
      </div>

      <input
        type="number"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900
          focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-60"
      />
    </div>
  );
}
