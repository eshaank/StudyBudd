"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createSupabaseBrowser } from "../../lib/supabase/client";
import {
  AVATAR_BUCKET,
  emitProfileUpdated,
  resolveProfileAvatarUrl,
} from "../../lib/profile";

const MAX_MB = 3;

function CameraIcon() {
  return (
    <svg className="w-8 h-8 text-slate-400 dark:text-white/40" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.832-2.208a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
    </svg>
  );
}

export default function AvatarUploader() {
  const supabase = createSupabaseBrowser();
  const inputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const u = data?.user ?? null;
      setUser(u);
      if (!u) return;

      // ✅ select("*") so it doesn't crash if avatar_path isn't in your schema
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", u.id)
        .maybeSingle();

      if (error) return;

      const pathOrUrl = profile?.avatar_path || profile?.avatar_url || "";
      if (!pathOrUrl) return;

      try {
        setAvatarUrl(await resolveProfileAvatarUrl(supabase, pathOrUrl));
      } catch (err) {
        console.error("Avatar signed URL error:", err);
      }
    })();
  }, []);

  const processFile = useCallback(
    async (file) => {
      if (!file || !user) return;
      setErrorMsg("");
      if (!file.type.startsWith("image/")) {
        setErrorMsg("Please upload an image file (PNG or JPG).");
        return;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        setErrorMsg(`File must be under ${MAX_MB}MB.`);
        return;
      }
      setUploading(true);
      try {
        const ext = file.name.split(".").pop()?.toLowerCase() || "png";
        const path = `${user.id}/avatar.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(AVATAR_BUCKET)
          .upload(path, file, {
            upsert: true,
            contentType: file.type,
            cacheControl: "3600",
          });
        if (upErr) throw upErr;
        const attempt1 = await supabase.from("profiles").upsert({
          id: user.id,
          avatar_path: path,
          updated_at: new Date().toISOString(),
        });
        if (attempt1.error) {
          const attempt2 = await supabase.from("profiles").upsert({
            id: user.id,
            avatar_url: path,
            updated_at: new Date().toISOString(),
          });
          if (attempt2.error) throw attempt2.error;
        }
        setAvatarUrl(await resolveProfileAvatarUrl(supabase, path));
        emitProfileUpdated();
      } catch (err) {
        console.error("Avatar upload error:", err);
        setErrorMsg(err?.message || "Upload failed. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [user, supabase]
  );

  async function onFileChange(e) {
    const file = e.target.files?.[0];
    await processFile(file);
    e.target.value = "";
  }

  function onDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    processFile(file);
  }

  function onDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  }

  function onDragLeave(e) {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget)) setIsDragging(false);
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-slate-700 dark:text-white/80">
        Profile photo
      </label>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`
          w-full rounded-2xl border-2 border-dashed transition-all duration-200
          flex flex-col items-center justify-center gap-2 py-6 px-4
          min-h-[160px]
          ${isDragging
            ? "border-indigo-400 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/10"
            : "border-slate-200 dark:border-white/15 bg-slate-50/80 dark:bg-white/5 hover:border-slate-300 dark:hover:border-white/25 hover:bg-slate-100/80 dark:hover:bg-white/10"}
          disabled:opacity-60 disabled:pointer-events-none
          focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 dark:focus:ring-offset-slate-900
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="hidden"
        />

        <div className="relative h-20 w-20 rounded-full overflow-hidden shrink-0 ring-2 ring-slate-200/80 dark:ring-white/20 bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center">
          {avatarUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={avatarUrl} alt="Profile" className="h-full w-full object-cover" />
              <span className="absolute inset-0 bg-black/40 dark:bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-white text-xs font-medium">
                Change
              </span>
            </>
          ) : (
            <CameraIcon />
          )}
        </div>

        <span className="text-sm font-medium text-slate-600 dark:text-white/70">
          {uploading ? "Uploading…" : avatarUrl ? "Click or drag to change photo" : "Click or drag to add photo"}
        </span>
        <span className="text-xs text-slate-500 dark:text-white/50">
          PNG or JPG, max {MAX_MB}MB
        </span>
      </button>

      {errorMsg ? (
        <div className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-200">
          {errorMsg}
        </div>
      ) : null}
    </div>
  );
}
