export default function GoogleAuthButton({ onClick, loading, label = "Continue with Google", loadingLabel = "Opening Google..." }) {
  return (
    <div className="pt-2">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
        <span className="text-xs text-slate-500 dark:text-slate-400">OR</span>
        <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
      </div>

      <button
        type="button"
        className="mt-3 w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 font-semibold text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-600
          focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800"
        onClick={onClick}
        disabled={loading}
      >
        {loading ? loadingLabel : label}
      </button>
    </div>
  );
}
