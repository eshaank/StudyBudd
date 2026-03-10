"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Timer, FolderOpen, MessageSquare, Brain, Layers } from "lucide-react";
import { PROFILE_UPDATED_EVENT } from "../../lib/profile";
import { createSupabaseBrowser } from "../../lib/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getAccessToken() {
  const supabase = createSupabaseBrowser();
  const { data: { session } } = await supabase.auth.getSession();
  const isDev = process.env.NODE_ENV === "development";
  return session?.access_token || (isDev ? "dev-token" : null);
}

async function apiFetch(path, token) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardHome() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    chatCount: 0,
    fileCount: 0,
    flashcardCount: 0,
    quizCount: 0,
  });
  const [continueCards, setContinueCards] = useState([]);

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    let active = true;

    async function load() {
      setLoading(true);
      const { data } = await supabase.auth.getUser();
      const u = data?.user ?? null;
      if (!active) return;
      setUser(u);

      if (!u?.email) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data: nextProfile, error: profileError } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", u.id)
        .maybeSingle();
      if (profileError) {
        console.warn("Dashboard profile load warning:", profileError);
      }
      if (!active) return;
      setProfile(nextProfile ?? null);

      const token = await getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const [chats, docs, flashcardSets, quizSets] = await Promise.all([
        apiFetch("/api/chat/conversations", token),
        apiFetch("/api/documents", token),
        apiFetch("/api/flashcards/sets", token),
        apiFetch("/api/quizzes/sets", token),
      ]);
      if (!active) return;

      const chatList = Array.isArray(chats) ? chats : [];
      const docList = Array.isArray(docs) ? docs : [];
      const fcList = Array.isArray(flashcardSets) ? flashcardSets : [];
      const qzList = Array.isArray(quizSets) ? quizSets : [];

      setStats({
        chatCount: chatList.length,
        fileCount: docList.length,
        flashcardCount: fcList.length,
        quizCount: qzList.length,
      });

      const cards = [];
      if (chatList.length > 0) {
        const latest = chatList[0];
        cards.push({
          id: "cont-chat",
          title: latest.title || "Recent Chat",
          subtitle: timeAgo(latest.updated_at || latest.created_at),
          href: "/dashboard/chat",
          badge: "Chat",
        });
      }
      if (docList.length > 0) {
        cards.push({
          id: "cont-files",
          title: `${docList.length} file${docList.length !== 1 ? "s" : ""} uploaded`,
          subtitle: "Manage your study library",
          href: "/dashboard/files",
          badge: "Files",
        });
      }
      if (fcList.length > 0) {
        const latest = fcList[0];
        cards.push({
          id: "cont-fc",
          title: latest.title || "Flashcard Set",
          subtitle: `${latest.card_count ?? 0} cards`,
          href: "/dashboard/flashcards",
          badge: "Flashcards",
        });
      }
      if (qzList.length > 0) {
        const latest = qzList[0];
        cards.push({
          id: "cont-qz",
          title: latest.title || "Quiz Set",
          subtitle: `${latest.question_count ?? 0} questions`,
          href: "/dashboard/quizzes",
          badge: "Quizzes",
        });
      }
      if (cards.length === 0) {
        cards.push({
          id: "cont-start",
          title: "Get Started",
          subtitle: "Upload notes or start a chat",
          href: "/dashboard/files",
          badge: "Start",
        });
      }

      setContinueCards(cards);
      setLoading(false);
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    function handleProfileUpdated() {
      load();
    }

    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);

    return () => {
      active = false;
      sub?.subscription?.unsubscribe();
      window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
    };
  }, []);

  useEffect(() => {
    function handleProfileUpdated() {
      const supabase = createSupabaseBrowser();
      if (!user?.id) return;
      supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle()
        .then(({ data }) => setProfile(data ?? null));
    }
    window.addEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, handleProfileUpdated);
  }, [user?.id]);

  const greeting = useMemo(() => getGreeting(), []);
  const displayName = useMemo(() => {
    if (profile?.full_name?.trim()) return profile.full_name.trim();
    if (!user?.email) return "there";
    return user.email.split("@")[0];
  }, [profile, user]);

  return (
    <div className="space-y-10">
      {/* Header */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm p-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-4xl font-bold text-slate-900 dark:text-white">
            {greeting}, {loading ? "..." : displayName}
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Let&apos;s pick up where you left off.
          </p>
        </div>
      </section>

      {/* Continue Where You Left Off */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">
            Continue where you left off
          </h3>
          <Link
            href="/dashboard/chat"
            className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300"
          >
            Open Chat &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 animate-pulse">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-16 mb-3" />
                <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : continueCards.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 text-slate-600 dark:text-slate-400">
            No recent activity yet. Start a chat or upload notes to see smart &ldquo;Continue&rdquo; cards here.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {continueCards.map((c) => (
              <Link
                key={c.id}
                href={c.href}
                className="group rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {c.badge}
                  </div>
                  <span className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition">
                    &rarr;
                  </span>
                </div>
                <div className="mt-3">
                  <div className="font-bold text-slate-900 dark:text-white">{c.title}</div>
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{c.subtitle}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Tools */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Your tools</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <ToolCard title="Pomodoro" desc="Focus sessions + streaks" href="/dashboard" pill="Free: 3/day" icon={Timer} />
          <ToolCard
            title="Files"
            desc="Upload notes, prep sheets"
            href="/dashboard/files"
            pill={loading ? "..." : stats.fileCount > 0 ? `${stats.fileCount} file${stats.fileCount !== 1 ? "s" : ""}` : "Upload"}
            icon={FolderOpen}
          />
          <ToolCard
            title="Chat"
            desc="Ask, summarize, plan"
            href="/dashboard/chat"
            pill={loading ? "..." : stats.chatCount > 0 ? `${stats.chatCount} thread${stats.chatCount !== 1 ? "s" : ""}` : "Start"}
            icon={MessageSquare}
          />
          <ToolCard
            title="Quizzes"
            desc="Generate & practice"
            href="/dashboard/quizzes"
            pill={loading ? "..." : stats.quizCount > 0 ? `${stats.quizCount} set${stats.quizCount !== 1 ? "s" : ""}` : "New"}
            icon={Brain}
          />
          <ToolCard
            title="Flashcards"
            desc="Create and review flashcards"
            href="/dashboard/flashcards"
            pill={loading ? "..." : stats.flashcardCount > 0 ? `${stats.flashcardCount} set${stats.flashcardCount !== 1 ? "s" : ""}` : "New"}
            icon={Layers}
          />
        </div>
      </section>

      {/* Soft "upgrade" area */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-slate-50 dark:from-indigo-950/50 dark:to-slate-800/50 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="font-bold text-slate-900 dark:text-white">
              Unlock full memory + unlimited focus
            </div>
            <div className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              Keep chat history, generate full quizzes, and remove daily limits.
            </div>
          </div>
          <div className="flex gap-2">
            <Link
              href="/pricing"
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white font-bold hover:bg-slate-800 dark:hover:bg-indigo-700 transition"
            >
              Upgrade
            </Link>
            <Link
              href="/dashboard/chat"
              className="px-4 py-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-900 dark:text-white font-bold hover:bg-slate-50 dark:hover:bg-slate-600 transition"
            >
              Keep studying
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function ToolCard({ title, desc, href, pill, icon: Icon }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm hover:shadow-md transition"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />}
          <div className="font-bold text-slate-900 dark:text-white">{title}</div>
        </div>
        <div className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
          {pill}
        </div>
      </div>
      <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">{desc}</div>
    </Link>
  );
}
