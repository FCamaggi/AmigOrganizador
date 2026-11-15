import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { type SupabaseConfig, supabaseConfig } from "./config";

/**
 * A Supabase client bound to this request's cookies. Server Components
 * can't write cookies, so `setAll` failing there is expected: the proxy
 * already refreshed the session for this request.
 */
export async function supabaseServer(
  config: SupabaseConfig | null = supabaseConfig(),
) {
  if (!config) throw new Error("Supabase is not configured");
  const store = await cookies();
  return createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (toSet) => {
        try {
          for (const { name, value, options } of toSet)
            store.set(name, value, options);
        } catch {
          // Called from a Server Component; the proxy handles refreshes.
        }
      },
    },
  });
}
