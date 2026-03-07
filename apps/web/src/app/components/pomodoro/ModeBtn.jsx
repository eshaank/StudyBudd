export default function ModeBtn({ active, activeClass, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={[
        "py-1.5 text-xs font-bold transition",
        active ? activeClass : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700",
      ].join(" ")}
      type="button"
    >
      {children}
    </button>
  );
}
