import { expect, test } from "@playwright/test";
import { E2E_CRON_SECRET } from "../playwright.config";

const ROUTE = "/api/cron/resync-calendars";

test("the calendar re-sync route refuses calls without the cron secret", async ({
  request,
}) => {
  // Typed by hand: the union of literals would make `Authorization` optional.
  for (const headers of [
    {},
    { Authorization: "Bearer wrong-secret-of-enough-length" },
    { Authorization: E2E_CRON_SECRET },
  ] as Record<string, string>[]) {
    const response = await request.get(ROUTE, { headers });
    expect(response.status()).toBe(401);
  }
});

test("the calendar re-sync route runs with the cron secret and answers counts only", async ({
  request,
}) => {
  const response = await request.get(ROUTE, {
    headers: { Authorization: `Bearer ${E2E_CRON_SECRET}` },
  });
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ synced: 0, failed: 0, orphaned: 0 });
});
