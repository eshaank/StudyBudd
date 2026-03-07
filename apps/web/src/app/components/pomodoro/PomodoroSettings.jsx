import ModeBtn from "./ModeBtn";
import TimeInput from "./TimeInput";

const ChevronIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

export default function PomodoroSettings({
  mode, switchMode, cycleCount, resetTimer,
  showEditTimes, setShowEditTimes, isRunning,
  studyMinutes, shortBreakMinutes, longBreakMinutes, longBreakEvery,
  setStudyMinutes, setShortBreakMinutes, setLongBreakMinutes, setLongBreakEvery,
}) {
  return (
    <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 pb-3 pt-2.5 space-y-3">
      {/* Mode switcher */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5">Mode</p>
        <div className="grid grid-cols-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
          <ModeBtn active={mode === "focus"} activeClass="bg-indigo-600 text-white" onClick={() => switchMode("focus")}>Focus</ModeBtn>
          <ModeBtn active={mode === "shortBreak"} activeClass="bg-emerald-600 text-white" onClick={() => switchMode("shortBreak")}>Short</ModeBtn>
          <ModeBtn active={mode === "longBreak"} activeClass="bg-blue-600 text-white" onClick={() => switchMode("longBreak")}>Long</ModeBtn>
        </div>
      </div>

      {/* Sessions + Reset */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          Sessions: <span className="font-bold text-slate-700 dark:text-slate-300">{cycleCount}</span>
        </span>
        <button
          onClick={resetTimer}
          className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          type="button"
        >
          Reset
        </button>
      </div>

      {/* Edit Times toggle */}
      <div>
        <button
          onClick={() => setShowEditTimes((v) => !v)}
          className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200 transition"
          type="button"
        >
          <span>Edit Times</span>
          <ChevronIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${showEditTimes ? "rotate-180" : ""}`} />
        </button>

        {showEditTimes && (
          <div className="mt-2 grid grid-cols-2 gap-2">
            <TimeInput label="Focus" suffix="min" value={studyMinutes} min={1} max={180} disabled={isRunning} onChange={setStudyMinutes} />
            <TimeInput label="Short break" suffix="min" value={shortBreakMinutes} min={1} max={60} disabled={isRunning} onChange={setShortBreakMinutes} />
            <TimeInput label="Long break" suffix="min" value={longBreakMinutes} min={1} max={90} disabled={isRunning} onChange={setLongBreakMinutes} />
            <TimeInput label="Every" suffix="sessions" value={longBreakEvery} min={2} max={10} disabled={isRunning} onChange={setLongBreakEvery} />
          </div>
        )}
        {isRunning && showEditTimes && (
          <p className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-500">Pause timer to edit times.</p>
        )}
      </div>
    </div>
  );
}
