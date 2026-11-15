import { createHash, timingSafeEqual } from "node:crypto";

/** Shortest `CRON_SECRET` accepted; a shorter one is treated as unset. */
export const MIN_CRON_SECRET_LENGTH = 16;

const digest = (value: string) => createHash("sha256").update(value).digest();

/**
 * Whether a request carries Vercel Cron's `Authorization: Bearer <CRON_SECRET>`.
 * Without a usable secret nothing is authorized. Compares digests in
 * constant time, so neither the content nor the length leaks.
 */
export function cronAuthorized(
  authorization: string | null,
  secret: string | undefined,
): boolean {
  if (!secret || secret.length < MIN_CRON_SECRET_LENGTH) return false;
  if (!authorization) return false;
  return timingSafeEqual(digest(authorization), digest(`Bearer ${secret}`));
}
