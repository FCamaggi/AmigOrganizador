import { randomBytes } from "node:crypto";

/**
 * A random 128-bit id. Group invite codes and plan ids double as link
 * secrets (ADR 0003), so they must never be sequential or guessable.
 */
export function newId(): string {
  return randomBytes(16).toString("base64url");
}
