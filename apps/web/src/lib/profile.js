import { createSupabaseBrowser } from "./supabase/client";

export async function getMyProfile() {
  const supabase = createSupabaseBrowser();

  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;

  const user = authData.user;
  if (!user) return { user: null, profile: null };

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, updated_at")
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
  const { data: authData, error: authErr } = await supabase.auth.getUser();
  if (authErr) throw authErr;

  const user = authData.user;
  if (!user) throw new Error("Not logged in");

  const { data, error } = await supabase
    .from("profiles")
    .update({ full_name, avatar_url, updated_at: new Date().toISOString() })
    .eq("id", user.id)
    .select("id, full_name, avatar_url, updated_at")
    .single();

  if (error) {
    console.error("updateMyProfile error:", error);
    throw error;
  }

  return data;
}
