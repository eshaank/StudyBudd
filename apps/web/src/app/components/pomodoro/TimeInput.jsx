export default function TimeInput({ label, suffix, value, onChange, min, max, disabled, size = "sm" }) {
  const wrapClass = size === "md"
    ? "rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-3"
    : "rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2";
  const labelClass = size === "md"
    ? "text-xs font-bold text-slate-500 dark:text-slate-400"
    : "text-[10px] font-bold text-slate-500 dark:text-slate-400";
  const inputClass = size === "md"
    ? "mt-1.5 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 disabled:opacity-50"
    : "mt-1 w-full rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2 py-1 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-300 dark:focus:ring-indigo-700 disabled:opacity-50";
  const suffixClass = size === "md"
    ? "text-[10px] text-slate-400 dark:text-slate-500 mt-1"
    : "text-[9px] text-slate-400 dark:text-slate-500 mt-0.5";

  return (
    <div className={wrapClass}>
      <div className={labelClass}>{label}</div>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className={inputClass}
      />
      <div className={suffixClass}>{suffix}</div>
    </div>
  );
}
