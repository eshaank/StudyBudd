"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowser } from "../../../lib/supabase/client";
import { getMyProfile } from "../../../lib/profile";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [touched, setTouched] = useState({
    email: false,
    password: false,
    confirmPw: false,
  });

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");

  // If already logged in, go to dashboard (not home)
  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const supabase = createSupabaseBrowser();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!isMounted) return;

        if (user) {
          router.replace("/dashboard");
          return;
        }
      } catch {
        // ignore
      } finally {
        if (isMounted) setCheckingSession(false);
      }
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // Validation
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

  const canSubmit = Boolean(
    email &&
      password &&
      confirmPw &&
      !emailErr &&
      !pwErr &&
      !confirmErr &&
      password === confirmPw
  );

  // Email/password signup
  async function onSubmit(e) {
    e.preventDefault();
    setTouched({ email: true, password: true, confirmPw: true });
    setError("");

    if (!canSubmit) return;

    setLoading(true);
    try {
      const supabase = createSupabaseBrowser();

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      // ✅ If email confirmation is OFF, session exists immediately
      if (data?.session) {
        await getMyProfile();
        router.push("/dashboard");
        router.refresh();
        return;
      }

      // ✅ If email confirmation is ON, user must confirm first → then login
      router.push("/login?checkEmail=1");
    } catch (err) {
      setError(err?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Google signup/login
  async function onGoogle() {
    setError("");
    setLoading(true);
    try {
      const supabase = createSupabaseBrowser();

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      // OAuth redirects automatically
    } catch (err) {
      setError(err?.message || "Google signup failed. Try again.");
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-blue-50 to-slate-100 px-4">
        <div className="rounded-2xl bg-white/90 backdrop-blur shadow-xl border border-slate-100 p-6 text-slate-700">
          Checking session...
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-50 via-blue-50 to-slate-100 flex items-center justify-center px-4 py-10">
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-indigo-300/30 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-blue-300/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-purple-300/20 blur-3xl" />

      <div className="relative z-10 grid w-full max-w-5xl grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-white/90 backdrop-blur shadow-xl border border-slate-100 p-6 md:p-8">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-indigo-700">
              StudyBudd • Auth
            </div>

            <h1 className="text-2xl font-bold text-slate-900 mt-3">
              Create your account
            </h1>
            <p className="text-slate-600 mt-1">
              Sign up to start using <span className="font-semibold">StudyBudd</span>.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                placeholder="you@school.edu"
                autoComplete="email"
                className={`mt-2 w-full rounded-xl border px-4 py-3 outline-none transition
                  text-slate-900 placeholder:text-slate-400 focus:ring-2
                  ${
                    emailErr
                      ? "border-red-300 focus:ring-red-200"
                      : "border-slate-200 focus:ring-indigo-200"
                  }`}
              />
              {emailErr && <p className="mt-2 text-sm text-red-600">{emailErr}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Password</label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  value={password}
                  type={showPw ? "text" : "password"}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={`w-full rounded-xl border px-4 py-3 outline-none transition
                    text-slate-900 placeholder:text-slate-400 focus:ring-2
                    ${
                      pwErr
                        ? "border-red-300 focus:ring-red-200"
                        : "border-slate-200 focus:ring-indigo-200"
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="shrink-0 rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  {showPw ? "Hide" : "Show"}
                </button>
              </div>
              {pwErr && <p className="mt-2 text-sm text-red-600">{pwErr}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">
                Confirm password
              </label>
              <div className="mt-2 flex items-center gap-2">
                <input
                  value={confirmPw}
                  type={showConfirmPw ? "text" : "password"}
                  onChange={(e) => setConfirmPw(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, confirmPw: true }))}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={`w-full rounded-xl border px-4 py-3 outline-none transition
                    text-slate-900 placeholder:text-slate-400 focus:ring-2
                    ${
                      confirmErr
                        ? "border-red-300 focus:ring-red-200"
                        : "border-slate-200 focus:ring-indigo-200"
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw((s) => !s)}
                  className="shrink-0 rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                >
                  {showConfirmPw ? "Hide" : "Show"}
                </button>
              </div>
              {confirmErr && (
                <p className="mt-2 text-sm text-red-600">{confirmErr}</p>
              )}
            </div>

            <div className="flex items-center justify-end pt-1">
              <button
                disabled={!canSubmit || loading}
                className="rounded-xl bg-indigo-600 px-4 py-3 text-white font-semibold hover:bg-indigo-700
                  disabled:opacity-50 disabled:cursor-not-allowed
                  focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                {loading ? "Creating account..." : "Sign up"}
              </button>
            </div>

            <div className="pt-2">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs text-slate-500">OR</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <button
                type="button"
                className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-900 hover:bg-slate-50
                  focus:outline-none focus:ring-2 focus:ring-indigo-200"
                onClick={onGoogle}
                disabled={loading}
              >
                {loading ? "Opening Google..." : "Continue with Google"}
              </button>
            </div>

            <p className="text-sm text-slate-600 pt-2">
              Already have an account?{" "}
              <Link className="text-indigo-700 hover:underline" href="/login">
                Log in
              </Link>
            </p>
          </form>

          <p className="text-xs text-slate-500 mt-6">
            Auth note: Email signup may require confirmation depending on Supabase settings.
          </p>
        </div>

        <div className="hidden md:flex flex-col justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 p-8 text-white shadow-xl">
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
            🚀 Get started
          </div>

          <h2 className="text-3xl font-bold mt-4">Build better study habits</h2>

          <p className="text-indigo-100 mt-3">
            Organize goals, generate quizzes, and track progress — all in one place.
          </p>

          <ul className="mt-6 space-y-3 text-indigo-100">
            <li className="flex items-center gap-2">
              <span className="text-white">✔</span> Create goals & streaks
            </li>
            <li className="flex items-center gap-2">
              <span className="text-white">✔</span> AI notes & flashcards
            </li>
            <li className="flex items-center gap-2">
              <span className="text-white">✔</span> Smart quizzes
            </li>
            <li className="flex items-center gap-2">
              <span className="text-white">✔</span> Study agents
            </li>
          </ul>

          <div className="mt-8 rounded-2xl bg-white/10 p-5">
            <p className="text-sm text-indigo-100">
              Tip: Use Google sign-in to get started in 2 clicks.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
