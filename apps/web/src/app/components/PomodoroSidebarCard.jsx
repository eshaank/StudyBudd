"use client";

import { useMemo, useState } from "react";
import { usePomodoro } from "./PomodoroProvider";

export default function PomodoroSidebarCard() {
  const {
    // if you used my updated store, hydrated exists; if not, it will be undefined
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
    switchMode,
    pad2,
  } = usePomodoro();

  const [showSettings, setShowSettings] = useState(false);

  // Ring math
  const radius = 46;
  const stroke = 8;
  const circumference = useMemo(() => 2 * Math.PI * radius, [radius]);

  const dashOffset = useMemo(() => {
    const pct = Math.min(100, Math.max(0, ringPercent));
    return circumference * (1 - pct / 100);
  }, [circumference, ringPercent]);

  const label = hydrated === false ? "Loading..." : modeLabel;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur shadow-sm overflow-visible">
      <div className="px-4 pt-4 pb-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-500">POMODORO</div>
            <div className="mt-1 font-extrabold text-slate-900 truncate">{label}</div>
            <div className="text-xs text-slate-500 mt-1">
              Focus sessions:{" "}
              <span className="font-semibold text-slate-700">{cycleCount}</span>
            </div>
          </div>

          <button
            onClick={() => setShowSettings((v) => !v)}
            className="shrink-0 text-xs font-bold rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 hover:bg-slate-50"
            aria-label="Toggle pomodoro settings"
            type="button"
          >
            {showSettings ? "Done" : "Settings"}
          </button>
        </div>

        {/* Ring + Controls */}
        <div className="mt-4 flex items-center gap-4">
          {/* Progress Ring */}
          <div className="relative w-[112px] h-[112px] shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                strokeWidth={stroke}
                className="stroke-slate-200"
              />
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                strokeWidth={stroke}
                className="stroke-indigo-500/20"
              />
              <circle
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                className="stroke-indigo-600"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-2xl font-extrabold tabular-nums text-slate-900">
                {pad2(mm)}:{pad2(ss)}
              </div>
              <div className="text-[11px] font-semibold text-slate-500">
                {isRunning ? "Running" : "Paused"} • {ringPercent}%
              </div>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex-1 min-w-0">
            {/* Segmented Mode Switch (fits sidebar) */}
            <div className="grid grid-cols-3 rounded-xl border border-slate-200 bg-white overflow-hidden">
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

            {/* Actions (wrap + equal widths) */}
            <div className="mt-3 flex flex-wrap gap-2">
              {!isRunning ? (
                <button
                  onClick={start}
                  className="flex-1 min-w-[110px] rounded-xl bg-indigo-600 px-3 py-2 text-white font-bold hover:bg-indigo-700"
                  type="button"
                >
                  Start
                </button>
              ) : (
                <button
                  onClick={pause}
                  className="flex-1 min-w-[110px] rounded-xl bg-slate-900 px-3 py-2 text-white font-bold hover:bg-slate-800"
                  type="button"
                >
                  Pause
                </button>
              )}

              <button
                onClick={resetTimer}
                className="flex-1 min-w-[110px] rounded-xl border border-slate-200 bg-white px-3 py-2 font-bold text-slate-800 hover:bg-slate-50"
                type="button"
              >
                Reset
              </button>
            </div>

            <p className="mt-2 text-[11px] text-slate-500">
              Auto-switches to breaks when focus ends.
            </p>
          </div>
        </div>
      </div>

      {/* Collapsible settings */}
      {showSettings ? (
        <div className="px-4 pb-4 border-t border-slate-200 bg-white">
          <div className="pt-4 grid grid-cols-2 gap-3">
            <MiniSetting
              label="Study"
              suffix="min"
              value={studyMinutes}
              min={1}
              max={180}
              disabled={isRunning}
              onChange={setStudyMinutes}
            />
            <MiniSetting
              label="Short"
              suffix="min"
              value={shortBreakMinutes}
              min={1}
              max={60}
              disabled={isRunning}
              onChange={setShortBreakMinutes}
            />
            <MiniSetting
              label="Long"
              suffix="min"
              value={longBreakMinutes}
              min={1}
              max={90}
              disabled={isRunning}
              onChange={setLongBreakMinutes}
            />
            <MiniSetting
              label="Every"
              suffix="sessions"
              value={longBreakEvery}
              min={2}
              max={10}
              disabled={isRunning}
              onChange={setLongBreakEvery}
            />
          </div>

          <p className="mt-3 text-[11px] text-slate-500">Tip: Settings lock while running.</p>
        </div>
      ) : null}
    </div>
  );
}

function Seg({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-2 py-2 text-xs font-extrabold transition",
        active ? "bg-indigo-600 text-white" : "bg-white text-slate-700 hover:bg-slate-50",
      ].join(" ")}
      type="button"
    >
      {children}
    </button>
  );
}

function MiniSetting({ label, suffix, value, onChange, min, max, disabled }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-bold text-slate-800">{label}</div>
        <div className="text-[11px] text-slate-500">{suffix}</div>
      </div>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-900
          focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:opacity-60"
      />
    </div>
  );
}
