import { type NextRequest, NextResponse } from "next/server";
import { authMode, safeNext } from "@/server/auth/config";
import { supabaseServer } from "@/server/auth/supabase";

/**
 * Where the magic link and Google send people back: trades the one-time
 * code for a session cookie, then continues to `next` (same site only).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get("next"));
  const code = searchParams.get("code");
  if (authMode() === "supabase" && code) {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }
  return NextResponse.redirect(
    new URL(`/entrar?error=1&next=${encodeURIComponent(next)}`, origin),
  );
}
