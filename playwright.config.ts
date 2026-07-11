import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
/** GitHub Actions sets GITHUB_ACTIONS; generic CI=true may be set locally by tooling. */
const isCi = !!process.env.GITHUB_ACTIONS;
const webServerCommand = isCi ? "node server.js" : "npm run dev";

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
        command: webServerCommand,
        cwd: isCi ? ".next/standalone" : undefined,
        url: `${baseURL}/`,
        reuseExistingServer: !isCi,
        timeout: 180_000,
        env: {
          ...process.env,
          PORT: process.env.PORT ?? "3000",
          HOSTNAME: "127.0.0.1",
          UPSTASH_REDIS_REST_URL:
            process.env.UPSTASH_REDIS_REST_URL ?? "https://ci-example.upstash.io",
          UPSTASH_REDIS_REST_TOKEN:
            process.env.UPSTASH_REDIS_REST_TOKEN ?? "ci-upstash-token",
        },
      },
});
