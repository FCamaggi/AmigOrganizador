import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { supabaseConfig } from "./auth/config";
import { supabaseServer } from "./auth/supabase";

export interface Session {
  readonly accountId: string;
  readonly displayName: string;
}

const COOKIE = "amigo_local_session";

const MAX_NAME = 60;

function metadataName(
  metadata: Record<string, unknown> | undefined,
  email: string | undefined,
): string {
  for (const key of ["display_name", "full_name", "name"]) {
    const value = metadata?.[key];
    if (typeof value === "string" && value.trim())
      return value.trim().slice(0, MAX_NAME);
  }
  return (email?.split("@")[0] ?? "").slice(0, MAX_NAME);
}

/**
 * Who is signed in. With Supabase configured, the verified token's subject is
 * the account id (ADR 0003); otherwise the local-mode cookie below.
 */
export async function getSession(): Promise<Session | null> {
  if (supabaseConfig()) {
    const supabase = await supabaseServer();
    const { data, error } = await supabase.auth.getClaims();
    const claims = data?.claims;
    if (error || !claims?.sub) return null;
    return {
      accountId: claims.sub,
      displayName: metadataName(
        claims.user_metadata as Record<string, unknown> | undefined,
        claims.email,
      ),
    };
  }
  return localSession();
}

/**
 * LOCAL MODE ONLY. A plain cookie with an account id and a name, so the app
 * runs without Supabase in development and e2e. It proves nothing about who
 * the person is.
 */
async function localSession(): Promise<Session | null> {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<Session>;
    if (
      typeof value.accountId === "string" &&
      typeof value.displayName === "string"
    ) {
      return { accountId: value.accountId, displayName: value.displayName };
    }
  } catch {
    // A malformed cookie is the same as no session.
  }
  return null;
}

/** LOCAL MODE ONLY: signs in by name. */
export async function startSession(displayName: string): Promise<Session> {
  if (supabaseConfig()) throw new Error("startSession is local mode only");
  const existing = await localSession();
  const session: Session = {
    accountId:
      existing?.accountId ?? `acc_${randomBytes(9).toString("base64url")}`,
    displayName,
  };
  (await cookies()).set(COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
  return session;
}

export async function endSession(): Promise<void> {
  if (supabaseConfig()) {
    await (await supabaseServer()).auth.signOut();
    return;
  }
  (await cookies()).delete(COOKIE);
}
