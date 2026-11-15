import { afterEach, describe, expect, it, vi } from "vitest";
import { authMode, safeNext } from "./config";

describe("safeNext", () => {
  it.each([
    "/",
    "/g/abc",
    "/perfil?next=/g/abc",
    "/g/abc#plans",
  ])("keeps the same-site path %s", (value) => {
    expect(safeNext(value)).toBe(value);
  });

  it.each([
    "//evil.com",
    "/\\evil.com",
    "\\/evil.com",
    "https://evil.com",
    "https:evil.com",
    "/\t/evil.com",
    "/\n/evil.com",
    "/\r\\evil.com",
    "/\t\\evil.com",
    "evil.com",
    "/.//evil.com",
    "/..//evil.com",
    "/%2e%2e//evil.com",
    "/a/../..//evil.com",
    "",
  ])("sends %j home", (value) => {
    expect(safeNext(value)).toBe("/");
  });

  it("sends missing values home", () => {
    expect(safeNext(null)).toBe("/");
    expect(safeNext(undefined)).toBe("/");
  });
});

describe("authMode", () => {
  afterEach(() => vi.unstubAllEnvs());

  const supabase = () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_x");
  };
  const noSupabase = () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
  };

  it("uses Supabase when it is configured", () => {
    supabase();
    vi.stubEnv("NODE_ENV", "production");
    expect(authMode()).toBe("supabase");
  });

  it("runs local mode in development without Supabase", () => {
    noSupabase();
    vi.stubEnv("NODE_ENV", "development");
    expect(authMode()).toBe("local");
  });

  it("refuses local mode in production without Supabase", () => {
    noSupabase();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AMIGO_LOCAL_MODE", "");
    expect(() => authMode()).toThrow(/Supabase/);
  });

  it("allows local mode in a production build marked as throwaway", () => {
    noSupabase();
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AMIGO_LOCAL_MODE", "true");
    expect(authMode()).toBe("local");
  });
});
