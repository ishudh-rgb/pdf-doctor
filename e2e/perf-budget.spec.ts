import { test, expect } from "@playwright/test";
import { dismissCookieBanner } from "./helpers";

const BUDGETS = {
  homepageLoadMs: 8000,
  toolPageLoadMs: 9000,
  homepageTransferKb: 3500,
  toolPageTransferKb: 4000,
} as const;

test.describe("Performance budgets", () => {
  test("homepage stays within load and transfer budgets", async ({ page }) => {
    const started = Date.now();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await dismissCookieBanner(page);
    await page.waitForSelector("#main-content", { timeout: 10000 });

    const loadMs = Date.now() - started;
    expect(loadMs).toBeLessThan(BUDGETS.homepageLoadMs);

    const transferKb = await page.evaluate(() => {
      const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
      const totalBytes = entries.reduce((sum, entry) => sum + (entry.transferSize || 0), 0);
      return totalBytes / 1024;
    });

    expect(transferKb).toBeLessThan(BUDGETS.homepageTransferKb);
  });

  test("pricing page stays within load and transfer budgets", async ({ page }) => {
    const started = Date.now();
    await page.goto("/pricing", { waitUntil: "domcontentloaded" });
    await dismissCookieBanner(page);
    await page.waitForSelector("#main-content", { timeout: 10000 });

    const loadMs = Date.now() - started;
    expect(loadMs).toBeLessThan(BUDGETS.homepageLoadMs);

    const transferKb = await page.evaluate(() => {
      const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
      const totalBytes = entries.reduce((sum, entry) => sum + (entry.transferSize || 0), 0);
      return totalBytes / 1024;
    });

    expect(transferKb).toBeLessThan(BUDGETS.homepageTransferKb);
  });

  test("merge-pdf page stays within load and transfer budgets", async ({ page }) => {
    const started = Date.now();
    await page.goto("/merge-pdf", { waitUntil: "domcontentloaded" });
    await dismissCookieBanner(page);
    await page.waitForSelector("#main-content", { timeout: 10000 });

    const loadMs = Date.now() - started;
    expect(loadMs).toBeLessThan(BUDGETS.toolPageLoadMs);

    const transferKb = await page.evaluate(() => {
      const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
      const totalBytes = entries.reduce((sum, entry) => sum + (entry.transferSize || 0), 0);
      return totalBytes / 1024;
    });

    expect(transferKb).toBeLessThan(BUDGETS.toolPageTransferKb);
  });
});
