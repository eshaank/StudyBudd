"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "../../lib/supabase/client";
import { emitProfileUpdated } from "../../lib/profile";
import AvatarUploader from "../components/AvatarUploader";
import ProductivityHeatmap from "../components/ProductivityHeatmap";

export default function AccountPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    let cancelled = false;

    async function load() {
      setLoading(true);
      setNotice("");

      const { data, error } = await supabase.auth.getUser();
      if (error) console.error("auth.getUser error:", error);

      const u = data?.user ?? null;
      if (cancelled) return;

      setUser(u);

      if (!u) {
        router.push("/auth");
        return;
      }

      const { data: profile, error: profErr } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", u.id)
        .maybeSingle();

      if (profErr) {
        console.warn("Profile load warning:", profErr);
      }

      if (!cancelled) {
        setFullName(profile?.full_name ?? "");
        setLoading(false);
      }
    }

    load();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) router.push("/auth");
    });

    return () => {
      cancelled = true;
      sub?.subscription?.unsubscribe();
    };
  }, [router]);

  function formatSupabaseError(e) {
    if (e && typeof e === "object") {
      const msg = e.message || e.error_description || e.error || "";
      const details = e.details || "";
      const hint = e.hint || "";
      const code = e.code || "";
      const status = e.status || "";

      const compact = [msg, details, hint, code && `code:${code}`, status && `status:${status}`]
        .filter(Boolean)
        .join(" | ");

      if (compact) return compact;
      try {
        return JSON.stringify(e);
      } catch {
        return String(e);
      }
    }
    return String(e);
  }

  async function saveChanges() {
    if (!user || saving) return;

    const supabase = createSupabaseBrowser();
    setSaving(true);
    setNotice("");

    try {
      const payload = {
        id: user.id,
        full_name: fullName,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" })
        .select("id, full_name, updated_at")
        .single();

      if (error) throw error;

      setFullName(data?.full_name ?? "");
      emitProfileUpdated();
      setNotice("Saved!");
    } catch (e) {
      const msg = formatSupabaseError(e);
      console.error("saveChanges error:", e);

      if (msg.toLowerCase().includes("row level security") || msg.toLowerCase().includes("rls")) {
        setNotice("Save failed: RLS policy blocking update/insert.");
      } else {
        setNotice("Save failed: " + msg);
      }
    } finally {
      setSaving(false);
      setTimeout(() => setNotice(""), 3000);
    }
  }

  async function signOut() {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 text-slate-900 dark:text-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10">
        <div className="mb-6">
          <h1 className="text-4xl font-bold">Account</h1>
          <p className="text-slate-600 dark:text-white/70 mt-1">Manage your profile and account settings.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 backdrop-blur-xl shadow-xl dark:shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)] p-6 sm:p-8">
          <div className="grid gap-6 sm:grid-cols-[220px_1fr] items-start">
            <div className="rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-4">
              <AvatarUploader />
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-white/80">Full name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                  className="mt-2 w-full rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-60 text-slate-900 dark:text-white"
                  placeholder="Enter your name"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={saveChanges}
                  disabled={loading || saving || !user}
                  className="rounded-xl bg-indigo-500 px-5 py-3 font-semibold text-white hover:bg-indigo-600 transition disabled:opacity-60"
                  type="button"
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>

                <button
                  onClick={signOut}
                  className="rounded-xl bg-slate-100 dark:bg-white/10 px-5 py-3 font-semibold text-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-white/15 transition"
                  type="button"
                >
                  Sign out
                </button>

                {notice ? <span className="text-sm text-slate-700 dark:text-white/80">{notice}</span> : null}
              </div>

              <p className="text-xs text-slate-500 dark:text-white/50">
                Profile data stays in Supabase tables. Avatar and productivity snapshot use private Storage.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <ProductivityHeatmap />
        </div>
      </div>
    </main>
  );
}
