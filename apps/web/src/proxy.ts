import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { authMode, supabaseConfig } from "@/server/auth/config";

/**
 * Refreshes the Supabase session before any page renders, so Server
 * Components read a valid token. Does nothing in local mode.
 */
export async function proxy(request: NextRequest) {
  const config = authMode() === "supabase" ? supabaseConfig() : null;
  if (!config) return NextResponse.next();
  const { url, publishableKey: key } = config;

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet, headers) => {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet)
          response.cookies.set(name, value, options);
        for (const [header, value] of Object.entries(headers ?? {}))
          response.headers.set(header, value);
      },
    },
  });
  // Must run before the response is sent, or a refreshed token is lost.
  await supabase.auth.getClaims();
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|ttf|woff2?)$).*)",
  ],
};
