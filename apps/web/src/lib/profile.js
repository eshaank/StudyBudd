import { createSupabaseBrowser } from "./supabase/client";

// Create a URL-safe handle from email prefix or any string
function slugifyHandle(input) {
  return (input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]/g, "-")   // keep a-z, 0-9, underscore; others -> "-"
    .replace(/-+/g, "-")          // collapse ---
    .replace(/^-|-$/g, "")        // trim leading/trailing -
    .slice(0, 24);                // keep it short
}

// Ensure handle is unique by checking existing profiles
async function ensureUniqueHandle(supabase, baseHandle) {
  const base = baseHandle || "user";
  let candidate = base;
  let n = 1;

  // Try a few options: base, base-2, base-3...
  while (true) {
    const { data, error } = await supabase
      .from("profiles")
      .select("handle")
      .eq("handle", candidate)
      .maybeSingle();

    if (error) throw error;
    if (!data) return candidate; // not taken

    n += 1;
    candidate = `${base}-${n}`;
    if (candidate.length > 30) {
      candidate = candidate.slice(0, 30);
    }
  }
}

export async function getMyProfile() {
  const supabase = createSupabaseBrowser();

  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;

  const user = authData.user;
  if (!user) return { user: null, profile: null };

  // ✅ Updated select to match your new schema
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, handle, display_name, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;

  // ✅ If no profile row yet, create it with a unique handle
  if (!profile) {
    const emailPrefix = user.email ? user.email.split("@")[0] : "user";
    const baseHandle = slugifyHandle(emailPrefix) || "user";

    const uniqueHandle = await ensureUniqueHandle(supabase, baseHandle);

    const displayName = user.user_metadata?.full_name
      || user.user_metadata?.name
      || emailPrefix;

    const { data: inserted, error: insertErr } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        handle: uniqueHandle,
        display_name: displayName,
      })
      .select("id, handle, display_name, created_at")
      .single();

    if (insertErr) throw insertErr;

    return { user, profile: inserted };
  }

  return { user, profile };
}

export async function updateMyProfile({ handle, display_name }) {
  const supabase = createSupabaseBrowser();

  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;

  const user = authData.user;
  if (!user) throw new Error("Not logged in");

  const update = {};
  if (typeof display_name === "string") update.display_name = display_name;

  // If you let users change handle, enforce uniqueness
  if (typeof handle === "string" && handle.trim()) {
    const base = slugifyHandle(handle);
    if (!base) throw new Error("Invalid handle");
    update.handle = await ensureUniqueHandle(supabase, base);
  }

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user.id);

  if (error) throw error;
}
