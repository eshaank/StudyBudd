import { createSupabaseBrowser } from "./supabase/client";

export const AVATAR_BUCKET = "avatars";
export const PROFILE_UPDATED_EVENT = "studybudd:profile-updated";

const SIGNED_URL_TTL = 60 * 60;

function extractAvatarStoragePath(pathOrUrl) {
  if (!pathOrUrl?.startsWith("http")) return pathOrUrl || "";

  const marker = `/${AVATAR_BUCKET}/`;
  const markerIndex = pathOrUrl.indexOf(marker);
  if (!pathOrUrl.includes("/storage/v1/object/") || markerIndex === -1) {
    return "";
  }

  return decodeURIComponent(pathOrUrl.slice(markerIndex + marker.length).split("?")[0]);
}

export async function resolveProfileAvatarUrl(supabase, pathOrUrl) {
  if (!pathOrUrl) return "";

  const storagePath = extractAvatarStoragePath(pathOrUrl);
  if (!storagePath && pathOrUrl.startsWith("http")) return pathOrUrl;

  const { data, error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .createSignedUrl(storagePath || pathOrUrl, SIGNED_URL_TTL);
  if (error) throw error;
  return data?.signedUrl || "";
}

export function emitProfileUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
  }
}

export async function getMyProfile() {
  const supabase = createSupabaseBrowser();

  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;

  const user = authData.user;
  if (!user) return { user: null, profile: null };

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;

  // If no profile row yet, create it (so updates work)
  if (!profile) {
    const { data: inserted, error: insertErr } = await supabase
      .from("profiles")
      .insert({ id: user.id, full_name: "", avatar_url: "" })
      .select()
      .single();

    if (insertErr) throw insertErr;
    return { user, profile: inserted };
  }

  return { user, profile };
}

export async function updateMyProfile({ full_name, avatar_url }) {
  const supabase = createSupabaseBrowser();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) throw new Error("Not logged in");

  const { error } = await supabase
    .from("profiles")
    .update({ full_name, avatar_url })
    .eq("id", user.id);

  if (error) throw error;
}
