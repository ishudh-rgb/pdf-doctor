import type { Page } from "@playwright/test";

/** Dismiss cookie banner when present so it does not block clicks. */
export async function dismissCookieBanner(page: Page) {
  const accept = page.getByRole("button", { name: "Accept all" });
  try {
    if (await accept.isVisible({ timeout: 2_000 })) {
      await accept.click();
    }
  } catch {
    /* banner not shown */
  }
}
