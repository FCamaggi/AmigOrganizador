import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";

export interface Session {
  readonly accountId: string;
  readonly displayName: string;
}

const COOKIE = "amigo_local_session";

/**
 * LOCAL MODE ONLY. A plain cookie with an account id and a name, so the
 * screens can be built before Supabase Auth (Google or magic link, ADR 0003)
 * exists. It proves nothing about who the person is; replace it in T3.
 */
export async function getSession(): Promise<Session | null> {
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

export async function startSession(displayName: string): Promise<Session> {
  const existing = await getSession();
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
  (await cookies()).delete(COOKIE);
}
