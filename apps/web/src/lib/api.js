import { createSupabaseBrowser } from "./supabase/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getAccessToken() {
  const supabase = createSupabaseBrowser();
  const { data: { session } } = await supabase.auth.getSession();
  const isDev = process.env.NODE_ENV === "development";
  return session?.access_token || (isDev ? "dev-token" : null);
}

async function authHeaders(extra = {}) {
  const token = await getAccessToken();
  if (!token) throw new Error("Not authenticated");
  return { Authorization: `Bearer ${token}`, ...extra };
}

export const api = {
  async get(path) {
    const res = await fetch(`${API_URL}${path}`, {
      headers: await authHeaders(),
    });
    if (!res.ok) throw res;
    return res.json();
  },

  async post(path, body) {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: await authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw res;
    return res.json();
  },

  async patch(path, body) {
    const res = await fetch(`${API_URL}${path}`, {
      method: "PATCH",
      headers: await authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(body),
    });
    if (!res.ok) throw res;
    return res.json();
  },

  async del(path) {
    const res = await fetch(`${API_URL}${path}`, {
      method: "DELETE",
      headers: await authHeaders(),
    });
    if (!res.ok) throw res;
    return res;
  },

  getAccessToken,
};
