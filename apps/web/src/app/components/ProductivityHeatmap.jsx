"use client";

import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowser } from "../../lib/supabase/client";

const BUCKET = "avatars";
const PROGRESS_FILE = "progress.json";

function toDayKey(d) {
  return d.toLocaleDateString("en-CA"); // YYYY-MM-DD
}

function startOfWeekSunday(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function normalizeRows(rows) {
  return (rows ?? []).map((row) => ({
    day: row.day,
    focus_minutes: Number(row.focus_minutes ?? 0),
    focus_sessions: Number(row.focus_sessions ?? 0),
  }));
}

function buildProgressPayload(rows) {
  return {
    updated_at: new Date().toISOString(),
    days: normalizeRows(rows),
  };
}

function buildHeatmapState(rows, alignedStart, end) {
  const map = new Map(normalizeRows(rows).map((row) => [row.day, row.focus_minutes]));

  const cells = [];
  const cursor = new Date(alignedStart);
  for (let i = 0; i < 371; i++) {
    const day = toDayKey(cursor);
    cells.push({ day, minutes: map.get(day) ?? 0, dow: cursor.getDay() });
    cursor.setDate(cursor.getDate() + 1);
  }

  let streak = 0;
  const back = new Date(end);
  while (true) {
    const day = toDayKey(back);
    if ((map.get(day) ?? 0) > 0) {
      streak++;
      back.setDate(back.getDate() - 1);
      continue;
    }
    break;
  }

  return { cells, streak };
}

async function downloadProgressRows(supabase, userId) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(`${userId}/${PROGRESS_FILE}`);
  if (error) throw error;

  const text = await data.text();
  const payload = JSON.parse(text);
  return Array.isArray(payload?.days) ? normalizeRows(payload.days) : [];
}

async function queryProgressRows(supabase, userId, startKey, endKey) {
  const { data, error } = await supabase
    .from("productivity_days")
    .select("day, focus_minutes, focus_sessions")
    .eq("user_id", userId)
    .gte("day", startKey)
    .lte("day", endKey)
    .order("day", { ascending: true });
  if (error) throw error;
  return normalizeRows(data);
}

async function uploadProgressSnapshot(supabase, userId, rows) {
  const blob = new Blob([JSON.stringify(buildProgressPayload(rows))], {
    type: "application/json",
  });
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(`${userId}/${PROGRESS_FILE}`, blob, {
      upsert: true,
      contentType: "application/json",
      cacheControl: "0",
    });
  if (error) throw error;
}

export default function ProductivityHeatmap() {
  const supabase = createSupabaseBrowser();

  const [cells, setCells] = useState([]); // array length ~371 (53w*7)
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) return;

      const today = new Date();
      const end = new Date(today);
      end.setHours(0, 0, 0, 0);

      const start = new Date(end);
      start.setDate(start.getDate() - 370);
      const alignedStart = startOfWeekSunday(start);

      const startKey = toDayKey(alignedStart);
      const endKey = toDayKey(end);

      let rows;
      try {
        rows = await downloadProgressRows(supabase, user.id);
      } catch (storageErr) {
        console.warn("Heatmap storage load fallback:", storageErr?.message || storageErr);
        rows = await queryProgressRows(supabase, user.id, startKey, endKey);
        try {
          await uploadProgressSnapshot(supabase, user.id, rows);
        } catch (syncErr) {
          console.warn("Heatmap storage backfill failed:", syncErr?.message || syncErr);
        }
      }

      const inRangeRows = normalizeRows(rows).filter(
        (row) => row.day >= startKey && row.day <= endKey
      );
      const nextState = buildHeatmapState(inRangeRows, alignedStart, end);
      setCells(nextState.cells);
      setStreak(nextState.streak);
    })();
  }, []);

  const max = useMemo(() => Math.max(1, ...cells.map((c) => c.minutes)), [cells]);

  function level(minutes) {
    if (minutes <= 0) return 0;
    const r = minutes / max;
    if (r < 0.25) return 1;
    if (r < 0.5) return 2;
    if (r < 0.75) return 3;
    return 4;
  }

  const colors = [
    "bg-slate-100 dark:bg-white/10",
    "bg-emerald-200 dark:bg-emerald-900/60",
    "bg-emerald-300 dark:bg-emerald-800/70",
    "bg-emerald-500 dark:bg-emerald-600/80",
    "bg-emerald-600 dark:bg-emerald-400/90",
  ];

  const weeks = useMemo(() => {
    const w = [];
    for (let i = 0; i < cells.length; i += 7) w.push(cells.slice(i, i + 7));
    return w;
  }, [cells]);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 backdrop-blur p-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-slate-900 dark:text-white font-bold text-lg">Productivity</div>
          <div className="text-slate-600 dark:text-white/70 text-sm">
            Current streak: <span className="font-bold text-slate-900 dark:text-white">{streak}</span> day(s)
          </div>
        </div>
        <div className="text-slate-500 dark:text-white/50 text-xs">Last 52 weeks</div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <div className="inline-flex gap-1">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((c) => (
                <div
                  key={c.day}
                  title={`${c.day}: ${c.minutes} min`}
                  className={`h-3 w-3 rounded-[3px] ${colors[level(c.minutes)]}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2 text-xs text-slate-500 dark:text-white/60">
        <span>Less</span>
        {colors.map((cls, i) => (
          <div key={i} className={`h-3 w-3 rounded-[3px] ${cls}`} />
        ))}
        <span>More</span>
      </div>

      <div className="mt-2 text-xs text-slate-400 dark:text-white/40">
        Tip: This fills in once you <b>finish</b> a focus Pomodoro (hits 0).
      </div>
    </div>
  );
}
