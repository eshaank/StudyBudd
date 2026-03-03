"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

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
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SharedDocumentPage() {
  const params = useParams();
  const token = useMemo(() => {
    const value = params?.token;
    return Array.isArray(value) ? value[0] : value;
  }, [params]);

  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);

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
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.detail || "Could not load shared document.");
          return;
        }

        const payload = await res.json();
        setData(payload);
      } catch (err) {
        console.error("Failed to load shared doc:", err);
        setError("Failed to load shared document.");
      } finally {
        setLoading(false);
      }
    }

    loadSharedDocument();
  }, [token]);

  async function handleDownload() {
    if (!token || downloading) return;

    setDownloading(true);
    setError("");
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        setError("Please log in to download this file.");
        return;
      }

      const res = await fetch(`${API_URL}/api/documents/shared/${token}/download`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.detail || "Download failed.");
        return;
      }

      const blob = await res.blob();
      const fileName = data?.document?.original_filename || "shared-document";
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error("Failed to download shared doc:", err);
      setError("Download failed.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-2xl font-bold">Shared File</h1>

        {loading ? (
          <p className="mt-4 text-white/70">Loading...</p>
        ) : error ? (
          <p className="mt-4 text-red-300">{error}</p>
        ) : data ? (
          <div className="mt-5 space-y-3">
            <p className="text-sm text-white/80">
              <span className="font-semibold">Filename:</span>{" "}
              {data.document.original_filename}
            </p>
            <p className="text-sm text-white/80">
              <span className="font-semibold">Type:</span>{" "}
              {String(data.document.file_type || "").toUpperCase()}
            </p>
            <p className="text-sm text-white/80">
              <span className="font-semibold">Access:</span> {data.access_level}
            </p>
            {data.expires_at ? (
              <p className="text-sm text-white/80">
                <span className="font-semibold">Expires:</span>{" "}
                {formatDate(data.expires_at)}
              </p>
            ) : null}

            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="mt-3 rounded-xl bg-indigo-500 px-4 py-2.5 font-semibold hover:bg-indigo-600 disabled:opacity-60"
            >
              {downloading ? "Downloading..." : "Download file"}
            </button>
          </div>
        ) : (
          <p className="mt-4 text-white/70">No shared file found.</p>
        )}
      </div>
    </main>
  );
}
