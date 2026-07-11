import { test, expect } from "@playwright/test";
import { dismissCookieBanner } from "./helpers";

/** Soft budgets for local/CI dev server — not production CDN targets. */
const CWV_BUDGETS = {
  lcpMs: 4500,
  cls: 0.25,
  tbtMs: 600,
} as const;

async function readWebVitals(page: import("@playwright/test").Page) {
  return page.evaluate(async () => {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const tbt = performance
      .getEntriesByType("longtask")
      .reduce((sum, entry) => sum + Math.max(0, entry.duration - 50), 0);

    const lcp = await new Promise<number>((resolve) => {
      let value = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          value = entry.startTime;
        }
      });
      observer.observe({ type: "largest-contentful-paint", buffered: true });
      window.setTimeout(() => {
        observer.disconnect();
        resolve(value);
      }, 3000);
    });

    let cls = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as PerformanceEntry[]) {
        const shift = entry as PerformanceEntry & { value?: number; hadRecentInput?: boolean };
        if (!shift.hadRecentInput && shift.value) cls += shift.value;
      }
    });
    clsObserver.observe({ type: "layout-shift", buffered: true });
    await new Promise((r) => window.setTimeout(r, 2000));
    clsObserver.disconnect();

    return {
      lcp,
      cls,
      tbt,
      domContentLoaded: nav?.domContentLoadedEventEnd ?? 0,
    };
  });
}

test.describe("Core Web Vitals budgets", () => {
  test("homepage meets LCP/CLS/TBT budgets", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await dismissCookieBanner(page);

    const vitals = await readWebVitals(page);
    expect(vitals.lcp).toBeGreaterThan(0);
    expect(vitals.lcp).toBeLessThan(CWV_BUDGETS.lcpMs);
    expect(vitals.cls).toBeLessThan(CWV_BUDGETS.cls);
    expect(vitals.tbt).toBeLessThan(CWV_BUDGETS.tbtMs);
  });

  test("merge-pdf meets LCP/CLS/TBT budgets", async ({ page }) => {
    await page.goto("/merge-pdf", { waitUntil: "networkidle" });
    await dismissCookieBanner(page);

    const vitals = await readWebVitals(page);
    expect(vitals.lcp).toBeGreaterThan(0);
    expect(vitals.lcp).toBeLessThan(CWV_BUDGETS.lcpMs);
    expect(vitals.cls).toBeLessThan(CWV_BUDGETS.cls);
    expect(vitals.tbt).toBeLessThan(CWV_BUDGETS.tbtMs);
  });

  test("pricing meets LCP/CLS/TBT budgets", async ({ page }) => {
    await page.goto("/pricing", { waitUntil: "networkidle" });
    await dismissCookieBanner(page);

    const vitals = await readWebVitals(page);
    expect(vitals.lcp).toBeGreaterThan(0);
    expect(vitals.lcp).toBeLessThan(CWV_BUDGETS.lcpMs);
    expect(vitals.cls).toBeLessThan(CWV_BUDGETS.cls);
    expect(vitals.tbt).toBeLessThan(CWV_BUDGETS.tbtMs);
  });
});
