"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createSupabaseBrowser } from "../../../lib/supabase/client";
import { useAuthSession } from "../hooks/useAuthSession";
import AuthLayout, { AuthLoadingScreen } from "../components/AuthLayout";
import AuthFeaturePanel from "../components/AuthFeaturePanel";
import GoogleAuthButton from "../components/GoogleAuthButton";

export default function SignupPage() {
  const router = useRouter();
  const { checkingSession } = useAuthSession("/");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false, confirmPw: false });
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

  const confirmErr = useMemo(() => {
    if (!touched.confirmPw) return "";
    if (!confirmPw) return "Please confirm your password.";
    if (confirmPw !== password) return "Passwords do not match.";
    return "";
  }, [confirmPw, password, touched.confirmPw]);

  const canSubmit = Boolean(email && password && confirmPw && !emailErr && !pwErr && !confirmErr && password === confirmPw);

  async function onSubmit(e) {
    e.preventDefault();
    setTouched({ email: true, password: true, confirmPw: true });
    setError("");
    if (!canSubmit) return;

    setLoading(true);
    try {
      const supabase = createSupabaseBrowser();
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      router.push("/");
    } catch (err) {
      setError(err?.message || "Signup failed. Please try again.");
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
      setError(err?.message || "Google signup failed. Try again.");
      setLoading(false);
    }
  }

  if (checkingSession) return <AuthLoadingScreen />;

  return (
    <AuthLayout
      featurePanel={
        <AuthFeaturePanel
          badge={"\uD83D\uDE80 Get started"}
          title="Build better study habits"
          description={"Organize goals, generate quizzes, and track progress \u2014 all in one place."}
          features={[
            "Create goals & streaks",
            "AI notes & flashcards",
            "Smart quizzes",
            "Study agents",
          ]}
          tip="Tip: Use Google sign-in to get started in 2 clicks."
        />
      }
    >
      <div className="rounded-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur shadow-xl border border-slate-100 dark:border-slate-700 p-6 md:p-8">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
            StudyBudd &bull; Auth
          </div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mt-3">Create your account</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Sign up to start using <span className="font-semibold">StudyBudd</span>.
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
                autoComplete="new-password"
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

          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirm password</label>
            <div className="mt-2 flex items-center gap-2">
              <input
                value={confirmPw}
                type={showConfirmPw ? "text" : "password"}
                onChange={(e) => setConfirmPw(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, confirmPw: true }))}
                placeholder={"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
                autoComplete="new-password"
                className={`w-full rounded-xl border px-4 py-3 outline-none transition text-slate-900 dark:text-white bg-white dark:bg-slate-700 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 ${
                  confirmErr ? "border-red-300 dark:border-red-700 focus:ring-red-200 dark:focus:ring-red-800" : "border-slate-200 dark:border-slate-600 focus:ring-indigo-200 dark:focus:ring-indigo-800"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw((s) => !s)}
                className="shrink-0 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-3 text-sm font-semibold text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800"
              >
                {showConfirmPw ? "Hide" : "Show"}
              </button>
            </div>
            {confirmErr && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{confirmErr}</p>}
          </div>

          <div className="flex items-center justify-end pt-1">
            <button
              disabled={!canSubmit || loading}
              className="rounded-xl bg-indigo-600 px-4 py-3 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800"
            >
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </div>

          <GoogleAuthButton onClick={onGoogle} loading={loading} />

          <p className="text-sm text-slate-600 dark:text-slate-400 pt-2">
            Already have an account?{" "}
            <Link className="text-indigo-700 dark:text-indigo-400 hover:underline" href="/login">Log in</Link>
          </p>
        </form>

        <p className="text-xs text-slate-500 dark:text-slate-500 mt-6">
          Auth note: Email signup may require confirmation depending on Supabase settings.
        </p>
      </div>
    </AuthLayout>
  );
}
