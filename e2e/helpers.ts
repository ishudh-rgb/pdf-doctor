import type { Page } from "@playwright/test";

const BASE_ORIGIN = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

/** Pre-seed consent so the cookie dialog does not block clicks (must run before navigation). */
export async function primeCookieConsent(page: Page) {
  await page.addInitScript(
    ([key, version]) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          version,
          essential: true,
          analytics: true,
          marketing: true,
          decidedAt: new Date().toISOString(),
        })
      );
    },
    ["onlymypdf_cookie_consent", "1.0"] as const
  );
}

/** Dismiss cookie banner when present so it does not block clicks. */
export async function dismissCookieBanner(page: Page) {
  const dialog = page.getByRole("dialog", { name: /cookie/i });
  const accept = page.getByRole("button", { name: /accept all/i });
  try {
    await dialog.waitFor({ state: "visible", timeout: 4_000 }).catch(() => {});
    if (await accept.isVisible()) {
      await accept.click();
      await dialog.waitFor({ state: "hidden", timeout: 10_000 });
    }
  } catch {
    /* banner not shown */
  }
}

/** Wait until Next.js route shell is replaced by real page content. */
export async function waitForMainHydrated(page: Page) {
  const main = page.locator("#main-content");
  await main.waitFor({ state: "visible", timeout: 30_000 });
  await main
    .getByText(/^Loading\.\.\.$/)
    .waitFor({ state: "hidden", timeout: 30_000 })
    .catch(() => {});
}

/** Faster, stable navigation for marketing/legal/tool pages in dev (avoids hanging on `load`). */
export async function gotoAndSettle(page: Page, path: string) {
  await primeCookieConsent(page);
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await dismissCookieBanner(page);
  await waitForMainHydrated(page);
}

/** CSRF-safe headers for tool API POSTs in CI/production parity. */
export function apiOriginHeaders(): Record<string, string> {
  return { Origin: BASE_ORIGIN };
}

/** Upload PDFs via hidden file input (more reliable than filechooser for programmatic clicks). */
export async function uploadPdfFiles(page: Page, filePaths: string | string[]) {
  const input = page.locator("#main-content input[type='file']").first();
  await input.waitFor({ state: "attached", timeout: 30_000 });
  await input.setInputFiles(filePaths);
}
