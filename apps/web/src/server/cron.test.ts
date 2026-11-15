import { describe, expect, it } from "vitest";
import { cronAuthorized } from "./cron";

const SECRET = "s3cr3t-value-long-enough-0123";

describe("cronAuthorized", () => {
  it("accepts the bearer token that matches the secret", () => {
    expect(cronAuthorized(`Bearer ${SECRET}`, SECRET)).toBe(true);
  });

  it.each([
    ["no header", null],
    ["an empty header", ""],
    ["the wrong token", "Bearer wrong-value-long-enough-0123"],
    ["a prefix of the secret", `Bearer ${SECRET.slice(0, -1)}`],
    ["the secret plus more", `Bearer ${SECRET}x`],
    ["the secret without the scheme", SECRET],
    ["another scheme", `Basic ${SECRET}`],
    ["lowercase scheme", `bearer ${SECRET}`],
  ])("rejects %s", (_label, header) => {
    expect(cronAuthorized(header, SECRET)).toBe(false);
  });

  it.each([
    ["unset", undefined],
    ["empty", ""],
    ["too short", "short"],
  ])("rejects everything when the secret is %s", (_label, secret) => {
    expect(cronAuthorized(`Bearer ${secret ?? ""}`, secret)).toBe(false);
    expect(cronAuthorized("Bearer ", secret)).toBe(false);
  });
});
