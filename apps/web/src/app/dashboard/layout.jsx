"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { PomodoroProvider } from "../components/PomodoroProvider";
import PomodoroSidebarCard from "../components/PomodoroSidebarCard";

const NAV = [
  { href: "/dashboard/files", label: "Files", desc: "Your study library", icon: "📁" },
  { href: "/dashboard/chat", label: "Chat", desc: "Ask & revisit answers", icon: "💬" },
  { href: "/dashboard/quizzes", label: "Quizzes", desc: "Practice by topic", icon: "🧠" },

  // ✅ ADD THIS
  { href: "/dashboard/flashcards", label: "Flashcards", desc: "Spaced repetition", icon: "🃏" },
];

function getTitle(pathname) {
  if (pathname?.includes("/dashboard/files")) return "Files";
  if (pathname?.includes("/dashboard/chat")) return "Chat";
  if (pathname?.includes("/dashboard/quizzes")) return "Quizzes";

  // ✅ ADD THIS
  if (pathname?.includes("/dashboard/flashcards")) return "Flashcards";

  return "Dashboard";
}

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const title = useMemo(() => getTitle(pathname), [pathname]);

  // hydration guard (localStorage/store can mismatch SSR)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <PomodoroProvider>
      <div className="min-h-screen relative bg-gradient-to-br from-indigo-50 via-blue-50 to-slate-100">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-indigo-300/30 blur-3xl" />
        <div className="pointer-events-none absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-blue-300/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-purple-300/20 blur-3xl" />

        {/* ✅ FULL-WIDTH WRAPPER */}
        <div className="relative z-10 w-full max-w-none px-4 sm:px-6 lg:px-10 xl:px-14 py-6">
          {/* Topbar */}
          <div className="mb-6 rounded-2xl bg-white/75 backdrop-blur shadow-xl border border-slate-100 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setOpen((v) => !v)}
                  className="sm:hidden rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 font-semibold hover:bg-slate-50"
                >
                  {open ? "Close" : "Menu"}
                </button>

                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-indigo-700">
                    StudyBudd • Dashboard
                  </div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2">
                    {title}
                  </h1>
                  <p className="text-sm text-slate-500">
                    Your workspace for studying, organizing, and revisiting learning.
                  </p>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-2">
                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 w-72">
                  🔎 Search files / chats
                </div>
                <Link
                  href="/"
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-white font-semibold hover:bg-indigo-700"
                >
                  Home
                </Link>
              </div>
            </div>
          </div>

          {/* ✅ Wider layout on big screens */}
          <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6 w-full min-w-0">
            {/* Sidebar */}
            <aside
              className={`${
                open ? "block" : "hidden"
              } lg:block rounded-2xl bg-white/80 backdrop-blur shadow-xl border border-slate-100 p-4 h-fit`}
            >
              <div className="sticky top-6 space-y-4">
                <div>
                  <p className="text-xs font-semibold text-slate-500">NAVIGATION</p>
                </div>

                <nav className="space-y-2">
                  {NAV.map((item) => {
                    const active = pathname?.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={`group block rounded-2xl border px-4 py-3 transition ${
                          active
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-lg"
                            : "bg-white border-slate-200 hover:bg-slate-50 text-slate-900"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{item.icon}</span>
                            <div>
                              <p className="font-bold">{item.label}</p>
                              <p className={`text-xs ${active ? "text-white/80" : "text-slate-500"}`}>
                                {item.desc}
                              </p>
                            </div>
                          </div>
                          <span className={`${active ? "text-white/90" : "text-slate-400"} font-bold`}>
                            →
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </nav>

                {/* Pomodoro */}
                <div className="rounded-2xl border border-slate-100 bg-white/70 p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-extrabold text-slate-900">Pomodoro</div>
                    <div className="text-xs font-semibold text-slate-500">Focus</div>
                  </div>
                  {mounted ? <PomodoroSidebarCard /> : null}
                </div>
              </div>
            </aside>

            {/* Main content */}
            <section className="min-w-0 rounded-2xl bg-white/80 backdrop-blur shadow-xl border border-slate-100 p-4 sm:p-6">
              <div className="w-full max-w-none">{children}</div>
            </section>
          </div>
        </div>
      </div>
    </PomodoroProvider>
  );
}
