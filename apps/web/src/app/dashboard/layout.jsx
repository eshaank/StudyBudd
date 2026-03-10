"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { FolderOpen, MessageSquare, Brain, Layers, ChevronRight } from "lucide-react";

import PomodoroSidebarCard from "../components/PomodoroSidebarCard";
import { StudyAIPanelProvider, useStudyAIPanel } from "../components/StudyAIPanelProvider";
import StudyAIPanel from "../../components/StudyAIPanel";

const NAV = [
  { href: "/dashboard/files", label: "Files", desc: "Your study library", icon: FolderOpen },
  { href: "/dashboard/chat", label: "Chat", desc: "Ask & revisit answers", icon: MessageSquare },
  { href: "/dashboard/quizzes", label: "Quizzes", desc: "Practice by topic", icon: Brain },
  { href: "/dashboard/flashcards", label: "Flashcards", desc: "Spaced repetition", icon: Layers },
];

export default function DashboardLayout({ children }) {
  return (
    <StudyAIPanelProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </StudyAIPanelProvider>
  );
}

function DashboardLayoutInner({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isOpen, togglePanel } = useStudyAIPanel();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
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
              sidebarOpen ? "block" : "hidden"
            } lg:block rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur shadow-xl border border-slate-100 dark:border-slate-700 p-4 h-fit`}
          >
            <div className="sticky top-6 space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">NAVIGATION</p>
              </div>

              <nav className="space-y-2">
                {NAV.map((item) => {
                  const active = pathname?.startsWith(item.href);
                  const Icon = item.icon;
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
                          <Icon className="w-5 h-5" />
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
                        <ChevronRight
                          className={`w-4 h-4 ${
                            active ? "text-white/90" : "text-slate-400 dark:text-slate-500"
                          }`}
                        />
                      </div>
                    </Link>
                  );
                })}
              </nav>

              {/* Pomodoro */}
              {mounted ? <PomodoroSidebarCard /> : null}
            </div>
          </aside>

          {/* Main content + AI panel row */}
          <div className="flex gap-4 min-w-0 h-[calc(100vh-8rem)]">
            {/* Content area */}
            <section className="min-w-0 flex-1 flex flex-col rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur shadow-xl border border-slate-100 dark:border-slate-700 p-4 sm:p-6 transition-all duration-300">
              <div className="w-full max-w-none flex-1 min-h-0 overflow-y-auto">
                {children}
              </div>
            </section>

            {/* AI Side Panel — inline, resizes content */}
            <StudyAIPanel />
          </div>
        </div>
      </div>

      {/* FAB toggle — visible when panel is closed */}
      {!isOpen && (
        <button
          onClick={togglePanel}
          title="Ask AI"
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 pl-4 pr-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 text-white text-sm font-semibold"
          style={{
            background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          }}
        >
          <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
          </svg>
          Ask AI
        </button>
      )}
    </div>
  );
}
