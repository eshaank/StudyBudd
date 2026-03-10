"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import { createSupabaseBrowser } from "../../../lib/supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getAccessToken() {
  const supabase = createSupabaseBrowser();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const isDev = process.env.NODE_ENV === "development";
  return session?.access_token || (isDev ? "dev-token" : null);
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBytes(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SharedDocumentPage() {
  const params = useParams();
  const token = useMemo(() => {
    const value = params?.token;
    return Array.isArray(value) ? value[0] : value;
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const [importError, setImportError] = useState("");

  useEffect(() => {
    async function loadSharedDocument() {
      if (!token) return;
      setLoading(true);
      setError("");
      try {
        const accessToken = await getAccessToken();
        if (!accessToken) {
          setError("Please log in to view this shared file.");
          return;
        }
        const res = await fetch(`${API_URL}/api/documents/shared/${token}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.detail || "Could not load shared document.");
          return;
        }
        setData(await res.json());
      } catch {
        setError("Failed to load shared document.");
      } finally {
        setLoading(false);
      }
    }
    loadSharedDocument();
  }, [token]);

  async function handleSaveToLibrary() {
    if (!token || importing) return;
    setImporting(true);
    setImportError("");
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        setImportError("Please log in to save this file.");
        return;
      }
      const res = await fetch(`${API_URL}/api/documents/shared/${token}/import`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setImportError(body.detail || "Failed to save file.");
        return;
      }
      setImported(true);
    } catch {
      setImportError("Failed to save file. Please try again.");
    } finally {
      setImporting(false);
    }
  }

  const isOwner = data?.access_level === "owner";

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Logo / brand */}
        <p className="text-center text-sm font-semibold text-indigo-400 tracking-widest uppercase mb-8">
          StudyBudd
        </p>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
          {/* Header stripe */}
          <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-violet-500" />

          <div className="p-7">
            {loading ? (
              <div className="flex flex-col items-center gap-3 py-8 text-white/50">
                <span className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm">Loading shared file…</p>
              </div>
            ) : error ? (
              <div className="py-8 text-center">
                <p className="text-red-400 font-semibold">{error}</p>
                <Link href="/login" className="mt-4 inline-block text-sm text-indigo-400 hover:underline">
                  Go to login →
                </Link>
              </div>
            ) : data ? (
              imported ? (
                /* ── Success state ── */
                <div className="py-6 text-center space-y-4">
                  <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-lg font-bold">Saved to your library!</p>
                    <p className="text-sm text-white/50 mt-1">
                      {data.document.original_filename} is now in your Files.
                    </p>
                  </div>
                  <Link
                    href="/dashboard/files"
                    className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold hover:bg-indigo-700 transition"
                  >
                    Open my Files
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              ) : (
                /* ── Normal state ── */
                <div className="space-y-5">
                  {/* File icon + name */}
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                      <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-base leading-snug break-words">
                        {data.document.original_filename}
                      </p>
                      <p className="text-xs text-white/40 mt-0.5 uppercase tracking-wide">
                        {data.document.file_type} · {formatBytes(data.document.file_size)}
                      </p>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="rounded-xl bg-white/5 divide-y divide-white/5 text-sm">
                    {data.expires_at && (
                      <div className="flex justify-between px-4 py-2.5">
                        <span className="text-white/40">Expires</span>
                        <span className="font-medium">{formatDate(data.expires_at)}</span>
                      </div>
                    )}
                    <div className="flex justify-between px-4 py-2.5">
                      <span className="text-white/40">Access</span>
                      <span className="font-medium capitalize">{data.access_level}</span>
                    </div>
                  </div>

                  {/* Error */}
                  {importError && (
                    <p className="text-sm text-red-400 text-center">{importError}</p>
                  )}

                  {/* Actions */}
                  {isOwner ? (
                    <div className="rounded-xl bg-indigo-500/10 border border-indigo-400/20 px-4 py-3 text-sm text-indigo-300 text-center">
                      This is your own file.{" "}
                      <Link href="/dashboard/files" className="underline hover:text-indigo-100">
                        View in library →
                      </Link>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSaveToLibrary}
                      disabled={importing}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold hover:bg-indigo-700 disabled:opacity-60 transition"
                    >
                      {importing ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Saving…
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                          Save to my library
                        </>
                      )}
                    </button>
                  )}
                </div>
              )
            ) : (
              <p className="py-8 text-center text-white/40">No shared file found.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
