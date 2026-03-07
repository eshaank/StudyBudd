"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { PomodoroProvider } from "../components/PomodoroProvider";
import PomodoroSidebarCard from "../components/PomodoroSidebarCard";

const NAV = [
  { href: "/dashboard/files", label: "Files", desc: "Your study library", icon: "📁" },
  { href: "/dashboard/chat", label: "Chat", desc: "Ask & revisit answers", icon: "💬" },
  { href: "/dashboard/quizzes", label: "Quizzes", desc: "Practice by topic", icon: "🧠" },
  { href: "/dashboard/flashcards", label: "Flashcards", desc: "Spaced repetition", icon: "🃏" },
];

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <PomodoroProvider>
        <div className="min-h-screen relative bg-gradient-to-br from-indigo-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
          {/* Decorative blobs */}
          <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-indigo-300/30 dark:bg-indigo-900/20 blur-3xl" />
          <div className="pointer-events-none absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-blue-300/30 dark:bg-blue-900/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-purple-300/20 dark:bg-purple-900/15 blur-3xl" />

          <div className="relative z-10 w-full max-w-none px-4 sm:px-6 lg:px-10 xl:px-14 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-6 w-full min-w-0">
              {/* Sidebar */}
              <aside
                className={`${
                  open ? "block" : "hidden"
                } lg:block rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur shadow-xl border border-slate-100 dark:border-slate-700 p-4 h-fit`}
              >
                <div className="sticky top-6 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">NAVIGATION</p>
                  </div>

                  <nav className="space-y-2">
                    {NAV.map((item) => {
                      const active = pathname?.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`group block rounded-2xl border px-4 py-3 transition ${
                            active
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-lg"
                              : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{item.icon}</span>
                              <div>
                                <p className="font-bold">{item.label}</p>
                                <p
                                  className={`text-xs ${
                                    active ? "text-white/80" : "text-slate-500 dark:text-slate-400"
                                  }`}
                                >
                                  {item.desc}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`${
                                active ? "text-white/90" : "text-slate-400 dark:text-slate-500"
                              } font-bold`}
                            >
                              →
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </nav>

                  {/* Pomodoro */}
                  {mounted ? <PomodoroSidebarCard /> : null}
                </div>
              </aside>

              {/* Main content */}
              <section className="min-w-0 flex flex-col min-h-[calc(100vh-6rem)] rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur shadow-xl border border-slate-100 dark:border-slate-700 p-4 sm:p-6">
                <div className="w-full max-w-none flex-1 min-h-0 overflow-hidden">
                  {children}
                </div>
              </section>
            </div>
          </div>
        </div>
    </PomodoroProvider>
  );
}
