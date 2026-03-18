export default function ModeBtn({ active, activeClass, onClick, children, size = "sm" }) {
  const sizeClass = size === "md" ? "py-2 text-sm" : "py-1.5 text-xs";
  return (
    <button
      onClick={onClick}
      className={[
        `${sizeClass} font-bold transition`,
        active ? activeClass : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700",
      ].join(" ")}
      type="button"
    >
      {children}
    </button>
  );
}
