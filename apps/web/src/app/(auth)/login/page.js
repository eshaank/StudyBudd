"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { createSupabaseBrowser } from "../../../lib/supabase/client";
import { useAuthSession } from "../hooks/useAuthSession";
import AuthLayout, { AuthLoadingScreen } from "../components/AuthLayout";
import AuthFeaturePanel from "../components/AuthFeaturePanel";
import GoogleAuthButton from "../components/GoogleAuthButton";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4">
          <div className="rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-xl border border-slate-100 dark:border-slate-700 p-6 text-slate-700 dark:text-slate-300">
            Loading...
          </div>
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const { checkingSession } = useAuthSession(redirectTo);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const emailErr = useMemo(() => {
    if (!touched.email) return "";
    if (!email.trim()) return "Email is required.";
    if (!/^\S+@\S+\.\S+$/.test(email)) return "Enter a valid email.";
    return "";
  }, [email, touched.email]);

  const pwErr = useMemo(() => {
    if (!touched.password) return "";
    if (!password) return "Password is required.";
    if (password.length < 6) return "Password must be at least 6 characters.";
    return "";
  }, [password, touched.password]);

  const canSubmit = Boolean(email && password && !emailErr && !pwErr);

  async function onSubmit(e) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setError("");
    if (!canSubmit) return;

    setLoading(true);
    try {
      const supabase = createSupabaseBrowser();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.location.href = redirectTo;
    } catch (err) {
      setError(err?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function onGoogle() {
    setError("");
    setLoading(true);
    try {
      const supabase = createSupabaseBrowser();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (err) {
      setError(err?.message || "Google login failed. Try again.");
      setLoading(false);
    }
  }

  if (checkingSession) return <AuthLoadingScreen />;

  return (
    <AuthLayout
      featurePanel={
        <AuthFeaturePanel
          badge={"\u2728 Study smarter"}
          title="Your AI Study Companion"
          description="Plan smarter. Learn faster. Track your progress with AI-powered tools built for students."
          features={[
            "Personalized learning paths",
            "AI-generated notes & quizzes",
            "Progress & streak tracking",
            "Chat with AI study agents",
          ]}
          tip="Finish History Notes and Flash cards"
        />
      }
    >
      <div className="rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-xl border border-slate-100 dark:border-slate-700 p-6 md:p-8">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
            StudyBudd &bull; Auth
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mt-3">Welcome back</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Log in to continue to <span className="font-semibold">StudyBudd</span>.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-400">{error}</div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              placeholder="you@school.edu"
              autoComplete="email"
              className={`mt-2 w-full rounded-xl border px-4 py-3 outline-none transition text-slate-900 dark:text-white bg-white dark:bg-slate-700 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 ${
                emailErr ? "border-red-300 dark:border-red-700 focus:ring-red-200 dark:focus:ring-red-800" : "border-slate-200 dark:border-slate-600 focus:ring-indigo-200 dark:focus:ring-indigo-800"
              }`}
            />
            {emailErr && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{emailErr}</p>}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
            <div className="mt-2 flex items-center gap-2">
              <input
                value={password}
                type={showPw ? "text" : "password"}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                placeholder={"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
                autoComplete="current-password"
                className={`w-full rounded-xl border px-4 py-3 outline-none transition text-slate-900 dark:text-white bg-white dark:bg-slate-700 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 ${
                  pwErr ? "border-red-300 dark:border-red-700 focus:ring-red-200 dark:focus:ring-red-800" : "border-slate-200 dark:border-slate-600 focus:ring-indigo-200 dark:focus:ring-indigo-800"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="shrink-0 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-3 text-sm font-semibold text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800"
              >
                {showPw ? "Hide" : "Show"}
              </button>
            </div>
            {pwErr && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{pwErr}</p>}
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              className="text-sm text-indigo-700 dark:text-indigo-400 hover:underline"
              onClick={() => alert("Forgot password comes next (Sprint 2).")}
            >
              Forgot password?
            </button>
            <button
              disabled={!canSubmit || loading}
              className="rounded-xl bg-indigo-600 px-4 py-3 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </div>

          <GoogleAuthButton onClick={onGoogle} loading={loading} />

          <p className="text-sm text-slate-600 dark:text-slate-400 pt-2">
            Don&apos;t have an account?{" "}
            <Link className="text-indigo-700 dark:text-indigo-400 hover:underline" href="/signup">Sign up</Link>
          </p>
        </form>

        <p className="text-xs text-slate-500 dark:text-slate-500 mt-6">
          Auth note: This page now uses Supabase for email/password + Google OAuth.
        </p>
      </div>
    </AuthLayout>
  );
}
