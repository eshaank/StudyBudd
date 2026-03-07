export default function AuthLayout({ children, featurePanel }) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center px-4 py-10">
      {/* Decorative background blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-indigo-300/30 dark:bg-indigo-900/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-blue-300/30 dark:bg-blue-900/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-purple-300/20 dark:bg-purple-900/15 blur-3xl" />

      <div className="relative z-10 grid w-full max-w-5xl grid-cols-1 md:grid-cols-2 gap-6">
        {children}
        {featurePanel}
      </div>
    </main>
  );
}

export function AuthLoadingScreen() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4">
      <div className="rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-xl border border-slate-100 dark:border-slate-700 p-6 text-slate-700 dark:text-slate-300">
        Checking session...
      </div>
    </main>
  );
}
