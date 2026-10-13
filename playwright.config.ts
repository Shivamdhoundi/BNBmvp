import { defineConfig, devices } from "@playwright/test";

// Always test a local production build with an unreachable test backend.
// Authenticated end-to-end acceptance requires a separate staging project.
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:3100", trace: "off", screenshot: "off" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100/sign-in",
    reuseExistingServer: false,
    env: { NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54329", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
      NEXT_PUBLIC_APP_URL: "http://127.0.0.1:3100", SUPABASE_SERVICE_ROLE_KEY: "test-service-key",
      HEALTHCHECK_SECRET: "local-test-health-secret-at-least-32-characters" },
  },
});
