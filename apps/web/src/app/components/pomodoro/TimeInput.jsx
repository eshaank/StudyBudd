export default function TimeInput({ label, suffix, value, onChange, min, max, disabled }) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2">
      <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{label}</div>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-300 dark:focus:ring-indigo-700 disabled:opacity-50"
      />
      <div className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">{suffix}</div>
    </div>
  );
}
