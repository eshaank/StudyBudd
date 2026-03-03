"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowser } from "../../lib/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

async function getAccessToken() {
  const supabase = createSupabaseBrowser();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const isDev = process.env.NODE_ENV === "development";
  return session?.access_token || (isDev ? "dev-token" : null);
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

async function apiFetch(path, token) {
  const res = await fetch(`${API_URL}/api${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

export default function DashboardHome() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [lastSession, setLastSession] = useState(null);
  const [continueCards, setContinueCards] = useState([]);
  const [stats, setStats] = useState({
    focusToday: null,
    fileCount: 0,
    chatCount: 0,
    quizCount: 0,
    flashcardCount: 0,
  });

  useEffect(() => {
    const supabase = createSupabaseBrowser();

    async function load() {
      setLoading(true);

      const { data } = await supabase.auth.getUser();
      const u = data?.user ?? null;
      setUser(u);

      if (!u) {
        setLoading(false);
        return;
      }

      const token = await getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const [
        conversations,
        documents,
        flashcardSets,
        quizSets,
        pomodoroResult,
        todayResult,
      ] = await Promise.all([
        apiFetch("/chat/conversations", token).then((r) => r ?? []),
        apiFetch("/documents", token).then((r) => r ?? []),
        apiFetch("/flashcards/sets", token).then((r) => r ?? []),
        apiFetch("/quizzes/sets", token).then((r) => r ?? []),
        supabase
          .from("pomodoro_sessions")
          .select("minutes, ended_at, local_day")
          .eq("user_id", u.id)
          .order("ended_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("productivity_days")
          .select("focus_sessions, focus_minutes")
          .eq("user_id", u.id)
          .eq("day", new Date().toLocaleDateString("en-CA"))
          .maybeSingle(),
      ]);

      const recentSession = pomodoroResult?.data ?? null;
      if (recentSession) {
        setLastSession({
          minutes: recentSession.minutes,
          at: recentSession.ended_at,
        });
      }

      const todayPomo = todayResult?.data;

      setStats({
        focusToday: todayPomo
          ? `${todayPomo.focus_sessions} today`
          : "0 today",
        fileCount: documents.length,
        chatCount: conversations.length,
        quizCount: quizSets.length,
        flashcardCount: flashcardSets.length,
      });

      const cards = [];

      if (documents.length > 0) {
        const recent = documents[0];
        cards.push({
          id: "cont-files",
          badge: "Files",
          title: recent.original_filename || "Recent File",
          subtitle: `Last opened: ${timeAgo(recent.uploaded_at || recent.created_at)}`,
          href: "/dashboard/files",
        });
      }

      if (conversations.length > 0) {
        const recent = conversations[0];
        cards.push({
          id: "cont-chat",
          badge: "Chat",
          title: recent.title || "Recent Conversation",
          subtitle: `${timeAgo(recent.created_at)} · Continue your thread`,
          href: "/dashboard/chat",
        });
      }

      if (todayPomo) {
        cards.push({
          id: "cont-focus",
          badge: "Focus",
          title: "Pomodoro Focus",
          subtitle: `${todayPomo.focus_sessions} session${todayPomo.focus_sessions !== 1 ? "s" : ""} · ${todayPomo.focus_minutes} min today`,
          href: "/dashboard",
        });
      }

      if (flashcardSets.length > 0) {
        const recent = flashcardSets[0];
        cards.push({
          id: "cont-flashcards",
          badge: "Review",
          title: recent.title || "Flashcard Set",
          subtitle: `${recent.card_count} cards · ${timeAgo(recent.created_at)}`,
          href: "/dashboard/flashcards",
        });
      }

      if (quizSets.length > 0 && cards.length < 4) {
        const recent = quizSets[0];
        cards.push({
          id: "cont-quizzes",
          badge: "Quiz",
          title: recent.title || "Quiz Set",
          subtitle: `${recent.question_count} questions · ${timeAgo(recent.created_at)}`,
          href: "/dashboard/quizzes",
        });
      }

      setContinueCards(cards);
      setLoading(false);
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

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

          {loading ? (
            <p className="text-slate-400">Loading your dashboard…</p>
          ) : lastSession ? (
            <p className="text-slate-600">
              Last focus session:{" "}
              <span className="font-semibold text-slate-800">
                {lastSession.minutes} min
              </span>{" "}
              · {timeAgo(lastSession.at)}
            </p>
          ) : (
            <p className="text-slate-600">
              {"Let's pick up where you left off."}
            </p>
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

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 bg-white p-5 animate-pulse"
              >
                <div className="h-4 w-16 bg-slate-200 rounded-full mb-4" />
                <div className="h-4 w-3/4 bg-slate-200 rounded mb-2" />
                <div className="h-3 w-1/2 bg-slate-100 rounded" />
              </div>
            ))}
          </div>
        ) : continueCards.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600">
            No recent activity yet. Start a chat, upload notes, or generate
            flashcards to see your activity here.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {continueCards.slice(0, 3).map((c) => (
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
                  <div className="font-extrabold text-slate-900 line-clamp-1">
                    {c.title}
                  </div>
                  <div className="mt-1 text-sm text-slate-600 line-clamp-1">
                    {c.subtitle}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Tools */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-slate-900">Your tools</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <ToolCard
            title="Pomodoro"
            desc="Focus sessions + streaks"
            href="/dashboard"
            pill={loading ? "…" : stats.focusToday}
          />
          <ToolCard
            title="Files"
            desc="Upload notes, prep sheets"
            href="/dashboard/files"
            pill={
              loading
                ? "…"
                : stats.fileCount > 0
                  ? `${stats.fileCount} file${stats.fileCount !== 1 ? "s" : ""}`
                  : "Upload"
            }
          />
          <ToolCard
            title="Chat"
            desc="Ask, summarize, plan"
            href="/dashboard/chat"
            pill={
              loading
                ? "…"
                : stats.chatCount > 0
                  ? `${stats.chatCount} thread${stats.chatCount !== 1 ? "s" : ""}`
                  : "Start"
            }
          />
          <ToolCard
            title="Quizzes"
            desc="Generate & practice"
            href="/dashboard/quizzes"
            pill={
              loading
                ? "…"
                : stats.quizCount > 0
                  ? `${stats.quizCount} set${stats.quizCount !== 1 ? "s" : ""}`
                  : "New"
            }
          />
          <ToolCard
            title="Flashcards"
            desc="Create and review flashcards"
            href="/dashboard/flashcards"
            pill={
              loading
                ? "…"
                : stats.flashcardCount > 0
                  ? `${stats.flashcardCount} set${stats.flashcardCount !== 1 ? "s" : ""}`
                  : "New"
            }
          />
        </div>
      </section>

      {/* Soft "upgrade" area */}
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
