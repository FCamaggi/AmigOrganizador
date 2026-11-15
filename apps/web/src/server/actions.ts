"use server";

import { redirect } from "next/navigation";
import { endSession, startSession } from "./session";

const MAX_NAME = 60;

function text(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

/** Only same-site paths, so `next` can't send people elsewhere. */
function safeNext(value: string): string {
  return value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

export interface SignInState {
  readonly error: boolean;
}

export async function signIn(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const name = text(formData, "name");
  if (name.length === 0 || name.length > MAX_NAME) return { error: true };
  await startSession(name);
  redirect(safeNext(text(formData, "next")));
}

export async function signOut(): Promise<void> {
  await endSession();
  redirect("/");
}
