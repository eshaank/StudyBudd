import { NextResponse } from "next/server";
import { createSupabaseServer } from "../../../lib/supabase/server";

export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  // After auth, Supabase redirects here with ?code=...
  if (code) {
    const supabase = createSupabaseServer();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Send user where YOU want after login
  return NextResponse.redirect(new URL("/dashboard", url.origin));
}
