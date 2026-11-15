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

/** Only same-site paths, so `next` can't send people elsewhere. */
export function safeNext(value: string | null | undefined): string {
  return typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/\\")
    ? value
    : "/";
}
