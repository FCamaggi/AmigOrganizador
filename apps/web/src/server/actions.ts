"use server";

import { redirect } from "next/navigation";
import { googleEnabled, safeNext, supabaseConfig } from "./auth/config";
import { supabaseServer } from "./auth/supabase";
import { requestOrigin } from "./origin";
import { endSession, startSession } from "./session";

const MAX_NAME = 60;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/** Where Supabase sends people back; must be in its redirect allow-list. */
async function callbackUrl(next: string): Promise<string> {
  const origin = process.env.SITE_URL ?? (await requestOrigin());
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

export interface SignInState {
  readonly error: boolean;
}

/** LOCAL MODE ONLY: sign in with just a name. */
export async function signIn(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  if (supabaseConfig()) return { error: true };
  const name = text(formData, "name");
  if (name.length === 0 || name.length > MAX_NAME) return { error: true };
  await startSession(name);
  redirect(safeNext(text(formData, "next")));
}

export interface MagicLinkState {
  readonly status: "idle" | "sent" | "invalid" | "failed";
}

/**
 * Emails a one-tap sign-in link (ADR 0003). The name is stored on the new
 * account, so the person shows up by name in their groups.
 */
export async function sendMagicLink(
  _prev: MagicLinkState,
  formData: FormData,
): Promise<MagicLinkState> {
  if (!supabaseConfig()) return { status: "failed" };
  const name = text(formData, "name");
  const email = text(formData, "email").toLowerCase();
  if (name.length > MAX_NAME || !EMAIL.test(email) || email.length > 254)
    return { status: "invalid" };
  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: await callbackUrl(safeNext(text(formData, "next"))),
      data: name ? { display_name: name } : undefined,
    },
  });
  return { status: error ? "failed" : "sent" };
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  if (!supabaseConfig() || !googleEnabled()) redirect("/entrar");
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: await callbackUrl(safeNext(text(formData, "next"))),
    },
  });
  if (error || !data.url) redirect("/entrar?error=1");
  redirect(data.url);
}

export async function signOut(): Promise<void> {
  await endSession();
  redirect("/");
}
