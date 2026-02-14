"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowser } from "../../lib/supabase/client";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardHome() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [recent, setRecent] = useState({
    lastSession: null,
    continueCards: [],
  });

  useEffect(() => {
    const supabase = createSupabaseBrowser();

    async function load() {
      setLoading(true);

      const { data } = await supabase.auth.getUser();
      const u = data?.user ?? null;
      setUser(u);

      if (u?.email) {
        setRecent({
          lastSession: {
            course: "PHIL-100",
            minutes: 25,
            at: Date.now() - 1000 * 60 * 60 * 10,
          },
          continueCards: [
            {
              id: "cont-files",
              type: "notes",
              title: "PHIL-100 — Free Will Notes",
              subtitle: "Last opened: yesterday",
              href: "/dashboard/files",
              badge: "Files",
            },
            {
              id: "cont-chat",
              type: "chat",
              title: "Last Chat: Compatibilism vs Determinism",
              subtitle: "Continue your thread",
              href: "/dashboard/chat",
              badge: "Chat",
            },
            {
              id: "cont-focus",
              type: "pomodoro",
              title: "Pomodoro Focus",
              subtitle: "2 sessions left today",
              href: "/dashboard",
              badge: "Focus",
            },
            {
              id: "cont-flashcards",
              type: "flashcards",
              title: "Flashcards — PHIL-100 Deck",
              subtitle: "7 cards due today",
              href: "/dashboard/flashcards",
              badge: "Review",
            },
          ],
        });
      } else {
        setRecent({ lastSession: null, continueCards: [] });
      }

      setLoading(false);
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => sub?.subscription?.unsubscribe();
  }, []);

  const greeting = useMemo(() => getGreeting(), []);
  const displayName = useMemo(() => {
    if (!user?.email) return "there";
    return user.email.split("@")[0];
  }, [user]);

  return (
    <div className="space-y-10">
      {/* Header */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-extrabold text-slate-900">
            {greeting}, {loading ? "…" : displayName} 👋
          </h2>

          {recent.lastSession ? (
            <p className="text-slate-600">
              Last session:{" "}
              <span className="font-semibold text-slate-800">
                {recent.lastSession.course}
              </span>{" "}
              · {recent.lastSession.minutes} min focus
            </p>
          ) : (
            <p className="text-slate-600">Let’s pick up where you left off.</p>
          )}
        </div>
      </section>

      {/* Continue Where You Left Off */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <h3 className="text-xl font-bold text-slate-900">
            Continue where you left off
          </h3>
          <Link
            href="/dashboard/chat"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Open Chat →
          </Link>
        </div>

        {recent.continueCards.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
            No recent activity yet. Start a chat or upload notes to see smart
            “Continue” cards here.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recent.continueCards.map((c) => (
              <Link
                key={c.id}
                href={c.href}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                    {c.badge}
                  </div>
                  <span className="text-slate-400 group-hover:text-slate-600 transition">
                    →
                  </span>
                </div>

                <div className="mt-3">
                  <div className="font-extrabold text-slate-900">{c.title}</div>
                  <div className="mt-1 text-sm text-slate-600">{c.subtitle}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Tools */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-slate-900">Your tools</h3>

        {/* ✅ changed lg:grid-cols-4 -> lg:grid-cols-5 to fit 5 tools */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <ToolCard
            title="Pomodoro"
            desc="Focus sessions + streaks"
            href="/dashboard"
            pill="Free: 3/day"
          />
          <ToolCard
            title="Files"
            desc="Upload notes, prep sheets"
            href="/dashboard/files"
            pill="Organize"
          />
          <ToolCard
            title="Chat"
            desc="Ask, summarize, plan"
            href="/dashboard/chat"
            pill="RAG soon"
          />
          <ToolCard
            title="Quizzes"
            desc="Generate & practice"
            href="/dashboard/quizzes"
            pill="Preview"
          />
          <ToolCard
            title="Flashcards"
            desc="Create and review flashcards"
            href="/dashboard/flashcards"
            pill="New"
          />
        </div>
      </section>

      {/* Soft “upgrade” area */}
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-indigo-50 to-slate-50 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="font-extrabold text-slate-900">
              Unlock full memory + unlimited focus
            </div>
            <div className="text-slate-600 text-sm mt-1">
              Keep chat history, generate full quizzes, and remove daily limits.
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href="/pricing"
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition"
            >
              Upgrade
            </Link>
            <Link
              href="/dashboard/chat"
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-900 font-bold hover:bg-slate-50 transition"
            >
              Keep studying
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function ToolCard({ title, desc, href, pill }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="font-extrabold text-slate-900">{title}</div>
        <div className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-700">
          {pill}
        </div>
      </div>
      <div className="mt-2 text-sm text-slate-600">{desc}</div>
    </Link>
  );
}
