import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
/** Test-only value: lets e2e call the cron route like Vercel Cron does. */
export const E2E_CRON_SECRET = "e2e-cron-secret-not-for-production";

/**
 * End-to-end tests run the production build in local mode: in-memory data
 * and name-only sign-in, so they need no Supabase project.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `pnpm build && pnpm start --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    env: {
      AMIGO_LOCAL_MODE: "true",
      NEXT_PUBLIC_SUPABASE_URL: "",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
      DATABASE_URL: "",
      CRON_SECRET: E2E_CRON_SECRET,
    },
  },
});
