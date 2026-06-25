import { test, expect } from "@playwright/test";
import { dismissCookieBanner } from "./helpers";

test.describe("Tool pages", () => {
  test("word to pdf shows convert UI", async ({ page }) => {
    await page.goto("/word-to-pdf");
    await dismissCookieBanner(page);

    await expect(page.getByRole("button", { name: /Convert to PDF/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Select file/i })).toBeVisible();
  });

  test("merge pdf shows upload UI", async ({ page }) => {
    await page.goto("/merge-pdf");
    await dismissCookieBanner(page);

    await expect(page.getByRole("button", { name: /Select file/i })).toBeVisible();
  });

  test("all-tools grid navigates to word to pdf", async ({ page }) => {
    await page.goto("/all-tools");
    await dismissCookieBanner(page);

    await page.locator('a.tool-card-ilove[href="/word-to-pdf"]').click();
    await expect(page).toHaveURL(/\/word-to-pdf$/);
    await expect(page.getByRole("button", { name: /Convert to PDF/i })).toBeVisible();
  });

  test("tool workspace appears before AEO block", async ({ page }) => {
    await page.goto("/word-to-pdf");
    await dismissCookieBanner(page);

    const mainText = await page.locator("#main-content").innerText();
    const convertIdx = mainText.indexOf("Convert to PDF");
    const aeoIdx = mainText.indexOf("About this tool");
    expect(convertIdx).toBeGreaterThanOrEqual(0);
    if (aeoIdx >= 0) {
      expect(convertIdx).toBeLessThan(aeoIdx);
    }
  });
});
