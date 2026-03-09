"use client";

import { createSupabaseBrowser } from "../supabase/client";

const BUCKET = "avatars";
const PROGRESS_FILE = "progress.json";

function toDayKey(d) {
  return d.toLocaleDateString("en-CA");
}

function startOfWeekSunday(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function uploadProgressSnapshot(supabase, userId) {
  const today = new Date();
  const end = new Date(today);
  end.setHours(0, 0, 0, 0);

  const start = new Date(end);
  start.setDate(start.getDate() - 370);
  const alignedStart = startOfWeekSunday(start);

  const startKey = toDayKey(alignedStart);
  const endKey = toDayKey(end);

  const { data: rows, error } = await supabase
    .from("productivity_days")
    .select("day, focus_minutes, focus_sessions")
    .eq("user_id", userId)
    .gte("day", startKey)
    .lte("day", endKey)
    .order("day", { ascending: true });
  if (error) throw error;

  const payload = {
    updated_at: new Date().toISOString(),
    days: (rows ?? []).map((row) => ({
      day: row.day,
      focus_minutes: Number(row.focus_minutes ?? 0),
      focus_sessions: Number(row.focus_sessions ?? 0),
    })),
  };

  const blob = new Blob([JSON.stringify(payload)], {
    type: "application/json",
  });
  const { error: uploadErr } = await supabase.storage
    .from(BUCKET)
    .upload(`${userId}/${PROGRESS_FILE}`, blob, {
      upsert: true,
      contentType: "application/json",
      cacheControl: "0",
    });
  if (uploadErr) throw uploadErr;
}

export async function logFocusCompletion({ minutes }) {
  const supabase = createSupabaseBrowser();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;
  if (!user) return;

  // local day in YYYY-MM-DD (browser locale-safe)
  const localDay = toDayKey(new Date());

  try {
    // 1) insert raw session
    const { error: sessionErr } = await supabase.from("pomodoro_sessions").insert({
      user_id: user.id,
      mode: "focus",
      minutes,
      ended_at: new Date().toISOString(),
      local_day: localDay,
    });
    if (sessionErr) throw sessionErr;

    // 2) upsert aggregate
    const { data: existing, error: fetchErr } = await supabase
      .from("productivity_days")
      .select("focus_sessions, focus_minutes")
      .eq("user_id", user.id)
      .eq("day", localDay)
      .maybeSingle();
    if (fetchErr) throw fetchErr;

    const nextSessions = (existing?.focus_sessions ?? 0) + 1;
    const nextMinutes = (existing?.focus_minutes ?? 0) + minutes;

    const { error: upsertErr } = await supabase.from("productivity_days").upsert({
      user_id: user.id,
      day: localDay,
      focus_sessions: nextSessions,
      focus_minutes: nextMinutes,
    });
    if (upsertErr) throw upsertErr;

    try {
      await uploadProgressSnapshot(supabase, user.id);
    } catch (snapshotErr) {
      console.error("progress snapshot sync failed:", snapshotErr);
    }
  } catch (err) {
    console.error("logFocusCompletion failed:", err);
  }
}
