/**
 * Which auth runs. With the Supabase variables set, people sign in with
 * Supabase Auth (magic link, Google; ADR 0003). Without them the app runs
 * in local mode: a name-only cookie for development and e2e, never for a
 * real deployment.
 */
export interface SupabaseConfig {
  readonly url: string;
  readonly publishableKey: string;
}

export function supabaseConfig(): SupabaseConfig | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) return null;
  return { url, publishableKey };
}

/** Google sign-in needs an OAuth client set up in Supabase first. */
export function googleEnabled(): boolean {
  return process.env.AUTH_GOOGLE_ENABLED === "true";
}

export type AuthMode = "supabase" | "local";

/**
 * Supabase when configured. Local mode (forgeable name-only cookie) only in
 * development or a production build explicitly marked as throwaway with
 * `AMIGO_LOCAL_MODE=true` (e2e); a real deployment missing the Supabase
 * variables fails loudly instead of trusting that cookie.
 */
export function authMode(): AuthMode {
  if (supabaseConfig()) return "supabase";
  if (
    process.env.NODE_ENV === "production" &&
    process.env.AMIGO_LOCAL_MODE !== "true"
  )
    throw new Error(
      "Supabase is not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  return "local";
}

const PROBE_ORIGIN = "http://same.site.invalid";

/** Control characters (URL parsers drop them) and backslashes (read as `/`). */
function hasUnsafeCharacter(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f || code === 0x5c) return true;
  }
  return false;
}

/**
 * Only same-site paths, so `next` can't send people elsewhere. Parsed the
 * way browsers parse it (control characters and backslashes are rejected
 * up front, since URL parsers strip or reinterpret them).
 */
export function safeNext(value: string | null | undefined): string {
  if (typeof value !== "string" || !value.startsWith("/")) return "/";
  if (hasUnsafeCharacter(value)) return "/";
  try {
    const url = new URL(value, PROBE_ORIGIN);
    if (url.origin !== PROBE_ORIGIN) return "/";
    // Dot segments are resolved by now, so check the result too:
    // "/.//evil.com" parses to the path "//evil.com".
    const path = url.pathname + url.search + url.hash;
    return path.startsWith("//") ? "/" : path;
  } catch {
    return "/";
  }
}
