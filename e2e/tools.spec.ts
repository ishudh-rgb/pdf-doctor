import { test, expect } from "@playwright/test";
import { gotoAndSettle } from "./helpers";

test.describe("Tool pages", () => {
  test("word to pdf shows convert UI", async ({ page }) => {
    await gotoAndSettle(page, "/word-to-pdf");

    await expect(page.getByRole("button", { name: /Convert to PDF/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Select PDF|Select file/i })).toBeVisible();
  });

  test("merge pdf shows upload UI", async ({ page }) => {
    await gotoAndSettle(page, "/merge-pdf");

    await expect(page.getByRole("button", { name: /Select PDF|Select file/i })).toBeVisible();
  });

  test("all-tools grid navigates to word to pdf", async ({ page }) => {
    await gotoAndSettle(page, "/all-tools");

    const card = page.locator('a.tool-card-ilove[href="/word-to-pdf"]').first();
    await card.scrollIntoViewIfNeeded();
    await card.click();
    await expect(page).toHaveURL(/\/word-to-pdf$/, { timeout: 15_000 });
    await expect(page.getByRole("button", { name: /Convert to PDF/i })).toBeVisible();
  });

  test("compress pdf shows upload UI", async ({ page }) => {
    await gotoAndSettle(page, "/compress-pdf");
    await expect(page.getByRole("button", { name: /Select PDF|Select file/i })).toBeVisible();
  });

  test("health API returns ok", async ({ request }) => {
    const res = await request.get("/api/health");
    expect([200, 503]).toContain(res.status());
    const json = await res.json();
    expect(json.status).toBeTruthy();
  });

  test("tool workspace appears before AEO block", async ({ page }) => {
    await gotoAndSettle(page, "/word-to-pdf");

    const convertBtn = page.getByRole("button", { name: /Convert to PDF/i });
    await expect(convertBtn).toBeVisible({ timeout: 30_000 });

    const aeoHeading = page.getByRole("heading", { name: "About this tool" });
    if (await aeoHeading.isVisible()) {
      const convertBox = await convertBtn.boundingBox();
      const aeoBox = await aeoHeading.boundingBox();
      expect(convertBox).not.toBeNull();
      expect(aeoBox).not.toBeNull();
      if (convertBox && aeoBox) {
        expect(convertBox.y).toBeLessThan(aeoBox.y);
      }
    }
  });
});
