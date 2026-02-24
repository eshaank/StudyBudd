"use client";

import { useState } from "react";
import { usePomodoro } from "./PomodoroProvider";

const ChevronIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

export default function PomodoroSidebarCard() {
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
    switchMode,
    pad2,
  } = usePomodoro();

  const [expanded, setExpanded] = useState(false);
  const [showEditTimes, setShowEditTimes] = useState(false);

  const label = hydrated === false ? "..." : modeLabel;

  const accentColor =
    mode === "focus"
      ? "text-indigo-600"
      : mode === "shortBreak"
      ? "text-emerald-600"
      : "text-blue-600";

  const ringStroke =
    mode === "focus"
      ? "stroke-indigo-500"
      : mode === "shortBreak"
      ? "stroke-emerald-500"
      : "stroke-blue-500";

  // ring geometry (r=22, viewBox 52x52)
  const RADIUS = 22;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS; // ~138.23
  const dashOffset = CIRCUMFERENCE * (1 - Math.min(100, Math.max(0, ringPercent)) / 100);

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* Always-visible compact row */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Small progress ring */}
        <div className="relative w-14 h-14 shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 52 52">
            {/* Track */}
            <circle cx="26" cy="26" r={RADIUS} fill="none" strokeWidth="3.5" className="stroke-slate-100" />
            {/* Progress */}
            <circle
              cx="26"
              cy="26"
              r={RADIUS}
              fill="none"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              className={ringStroke}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-[11px] font-extrabold tabular-nums leading-none ${accentColor}`}>
              {pad2(mm)}:{pad2(ss)}
            </span>
          </div>
        </div>

        {/* Label */}
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Pomodoro
          </div>
          <div className="text-xs font-bold text-slate-700 mt-0.5">{label}</div>
        </div>

        {!isRunning ? (
          <button
            onClick={start}
            className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition"
            type="button"
          >
            Start
          </button>
        ) : (
          <button
            onClick={pause}
            className="shrink-0 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700 transition"
            type="button"
          >
            Pause
          </button>
        )}

        <button
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          aria-label="Toggle options"
          type="button"
        >
          <ChevronIcon
            className={`w-4 h-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* Dropdown panel */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 px-3 pb-3 pt-2.5 space-y-3">
          {/* Mode switcher */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
              Mode
            </p>
            <div className="grid grid-cols-3 rounded-lg border border-slate-200 bg-white overflow-hidden">
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
          </div>

          {/* Sessions + Reset */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              Sessions:{" "}
              <span className="font-bold text-slate-700">{cycleCount}</span>
            </span>
            <button
              onClick={resetTimer}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 rounded px-2 py-1 hover:bg-slate-200 transition"
              type="button"
            >
              Reset
            </button>
          </div>

          {/* Edit Times toggle */}
          <div>
            <button
              onClick={() => setShowEditTimes((v) => !v)}
              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition"
              type="button"
            >
              <span>Edit Times</span>
              <ChevronIcon
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  showEditTimes ? "rotate-180" : ""
                }`}
              />
            </button>

            {showEditTimes && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <TimeInput
                  label="Focus"
                  suffix="min"
                  value={studyMinutes}
                  min={1}
                  max={180}
                  disabled={isRunning}
                  onChange={setStudyMinutes}
                />
                <TimeInput
                  label="Short break"
                  suffix="min"
                  value={shortBreakMinutes}
                  min={1}
                  max={60}
                  disabled={isRunning}
                  onChange={setShortBreakMinutes}
                />
                <TimeInput
                  label="Long break"
                  suffix="min"
                  value={longBreakMinutes}
                  min={1}
                  max={90}
                  disabled={isRunning}
                  onChange={setLongBreakMinutes}
                />
                <TimeInput
                  label="Every"
                  suffix="sessions"
                  value={longBreakEvery}
                  min={2}
                  max={10}
                  disabled={isRunning}
                  onChange={setLongBreakEvery}
                />
              </div>
            )}
            {isRunning && showEditTimes && (
              <p className="mt-1.5 text-[10px] text-slate-400">Pause timer to edit times.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ModeBtn({ active, activeClass, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={[
        "py-1.5 text-xs font-bold transition",
        active ? activeClass : "bg-white text-slate-600 hover:bg-slate-50",
      ].join(" ")}
      type="button"
    >
      {children}
    </button>
  );
}

function TimeInput({ label, suffix, value, onChange, min, max, disabled }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-2">
      <div className="text-[10px] font-bold text-slate-500">{label}</div>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-300 disabled:opacity-50"
      />
      <div className="text-[9px] text-slate-400 mt-0.5">{suffix}</div>
    </div>
  );
}
