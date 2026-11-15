import { type NextRequest, NextResponse } from "next/server";
import { authMode, safeNext } from "@/server/auth/config";
import { supabaseServer } from "@/server/auth/supabase";
import { profiles } from "@/server/repository";

/**
 * Where the magic link and Google send people back: trades the one-time
 * code for a session cookie, then continues to `next` (same site only), or
 * to the profile editor on a first sign-in from the home page.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get("next"));
  const code = searchParams.get("code");
  if (authMode() === "supabase" && code) {
    const supabase = await supabaseServer();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // First stop for someone with no profile yet, unless they came from an
      // invite: the group asks for the profile once they've joined.
      const needsProfile =
        next === "/" &&
        data.user &&
        !(await profiles().findByAccount(data.user.id));
      return NextResponse.redirect(
        new URL(needsProfile ? "/perfil" : next, origin),
      );
    }
  }
  return NextResponse.redirect(
    new URL(`/entrar?error=1&next=${encodeURIComponent(next)}`, origin),
  );
}
