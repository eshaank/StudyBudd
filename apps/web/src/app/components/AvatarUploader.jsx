"use client";

import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowser } from "../../lib/supabase/client";
import {
  AVATAR_BUCKET,
  emitProfileUpdated,
  resolveProfileAvatarUrl,
} from "../../lib/profile";

const MAX_MB = 3;
const AVATAR_SIZE_PX = 512;

async function normalizeAvatarFile(file) {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error("Could not read the selected image."));
      nextImage.src = objectUrl;
    });

    const sourceWidth = image.naturalWidth || image.width;
    const sourceHeight = image.naturalHeight || image.height;
    const cropSize = Math.min(sourceWidth, sourceHeight);

    if (!cropSize) {
      throw new Error("Invalid image dimensions.");
    }

    const targetSize = Math.min(AVATAR_SIZE_PX, cropSize);
    const canvas = document.createElement("canvas");
    canvas.width = targetSize;
    canvas.height = targetSize;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Avatar processing is not available in this browser.");
    }

    const offsetX = Math.max(0, (sourceWidth - cropSize) / 2);
    const offsetY = Math.max(0, (sourceHeight - cropSize) / 2);

    ctx.clearRect(0, 0, targetSize, targetSize);
    ctx.drawImage(
      image,
      offsetX,
      offsetY,
      cropSize,
      cropSize,
      0,
      0,
      targetSize,
      targetSize
    );

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (nextBlob) => {
          if (nextBlob) resolve(nextBlob);
          else reject(new Error("Failed to process avatar image."));
        },
        "image/png"
      );
    });

    return new File([blob], "avatar.png", { type: "image/png" });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function AvatarUploader() {
  const supabase = createSupabaseBrowser();
  const inputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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

  async function onFileChange(e) {
    setErrorMsg("");
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please upload an image file.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setErrorMsg(`Max file size is ${MAX_MB}MB.`);
      e.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const processedFile = await normalizeAvatarFile(file);
      const path = `${user.id}/avatar.png`;

      // Upload to Storage
      const { error: upErr } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, processedFile, {
          upsert: true,
          contentType: processedFile.type,
          cacheControl: "3600",
        });

      if (upErr) throw upErr;

      // Try writing avatar_path first; if column doesn't exist, fallback to avatar_url.
      const attempt1 = await supabase.from("profiles").upsert({
        id: user.id,
        avatar_path: path,
        updated_at: new Date().toISOString(),
      });

      if (attempt1.error) {
        // Fallback for older schemas that still use avatar_url.
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
      setErrorMsg(err?.message || "Upload failed. Check console.");

      // Helpful hint for common issues
      // - 403/permission denied => Storage RLS policy
      // - signed URL failure => bucket or object path policy mismatch
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-full overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
          ) : (
            <span className="text-white/60 font-bold">?</span>
          )}
        </div>

        <div className="flex-1">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full rounded-xl bg-white text-slate-900 font-semibold px-4 py-2 hover:bg-white/90 transition disabled:opacity-60"
          >
            {uploading ? "Uploading..." : "Upload avatar"}
          </button>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="hidden"
          />

          <p className="mt-2 text-xs text-white/50">
            PNG/JPG up to {MAX_MB}MB • Center-cropped and capped at {AVATAR_SIZE_PX}px • Stored in Supabase Storage
          </p>

          {errorMsg ? (
            <div className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {errorMsg}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
