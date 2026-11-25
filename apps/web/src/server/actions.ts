"use server";

import { redirect, unstable_rethrow } from "next/navigation";
import { authMode, googleEnabled, safeNext } from "./auth/config";
import { supabaseServer } from "./auth/supabase";
import { requestOrigin } from "./origin";
import { profiles } from "./repository";
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
  if (authMode() === "supabase") return { error: true };
  const name = text(formData, "name");
  if (name.length === 0 || name.length > MAX_NAME) return { error: true };
  await startSession(name);
  redirect(safeNext(text(formData, "next")));
}

export interface EmailCodeState {
  readonly status:
    | "idle"
    | "sent"
    | "invalid"
    | "failed"
    | "rateLimited"
    | "badCode";
  readonly email: string;
}

const CODE = /^\d{6}$/;

/**
 * Emails a 6-digit sign-in code (ADR 0003: no passwords). A code typed into
 * the app works in any mail client and on any device, where a link would
 * open in whatever browser the mail app picks. The name is stored on a new
 * account, so the person shows up by name in their groups.
 */
export async function sendSignInCode(
  _prev: EmailCodeState,
  formData: FormData,
): Promise<EmailCodeState> {
  const name = text(formData, "name");
  const email = text(formData, "email").toLowerCase();
  if (authMode() !== "supabase") return { status: "failed", email };
  // The name is required: a new account needs it to show up in its groups.
  if (
    name.length === 0 ||
    name.length > MAX_NAME ||
    !EMAIL.test(email) ||
    email.length > 254
  )
    return { status: "invalid", email };
  try {
    const supabase = await supabaseServer();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true, data: { display_name: name } },
    });
    if (!error) return { status: "sent", email };
    // Logged without the address, so a failure can be traced in the logs.
    console.error("sign-in code not sent", error.code, error.status);
    return {
      status: error.status === 429 ? "rateLimited" : "failed",
      email,
    };
  } catch (cause) {
    console.error("sign-in code threw", cause);
    return { status: "failed", email };
  }
}

/** Trades the emailed code for a session, then continues like the callback. */
export async function verifySignInCode(
  _prev: EmailCodeState,
  formData: FormData,
): Promise<EmailCodeState> {
  const email = text(formData, "email").toLowerCase();
  const token = text(formData, "code").replace(/\s+/g, "");
  const next = safeNext(text(formData, "next"));
  if (authMode() !== "supabase") return { status: "failed", email };
  if (!EMAIL.test(email) || !CODE.test(token))
    return { status: "badCode", email };
  try {
    const supabase = await supabaseServer();
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: "email",
    });
    if (error || !data.user) {
      console.error("sign-in code rejected", error?.code, error?.status);
      return {
        status: error?.status === 429 ? "rateLimited" : "badCode",
        email,
      };
    }
    // First stop for someone with no profile yet, unless they came from an
    // invite: the group asks for the profile once they've joined.
    const needsProfile =
      next === "/" &&
      (await profiles().listForAccount(data.user.id)).length === 0;
    redirect(needsProfile ? "/perfil" : next);
  } catch (cause) {
    // redirect() works by throwing; let it through.
    unstable_rethrow(cause);
    console.error("sign-in verify threw", cause);
    return { status: "failed", email };
  }
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  if (authMode() !== "supabase" || !googleEnabled()) redirect("/entrar");
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
