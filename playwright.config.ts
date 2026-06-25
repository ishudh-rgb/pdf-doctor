import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
/** GitHub Actions sets GITHUB_ACTIONS; generic CI=true may be set locally by tooling. */
const isCi = !!process.env.GITHUB_ACTIONS;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  workers: isCi ? 1 : undefined,
  reporter: isCi ? "github" : "list",
  timeout: 60_000,
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_SKIP_WEBSERVER
    ? undefined
    : {
        command: isCi ? "npm run start" : "npm run dev",
        url: `${baseURL}/api/health`,
        reuseExistingServer: !isCi,
        timeout: 120_000,
      },
});
