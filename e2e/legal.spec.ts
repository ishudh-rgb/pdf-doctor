import { test, expect } from "@playwright/test";

test.describe("Legal & branding", () => {
  test("terms page uses OnlyMyPDF not Only4PDF", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.getByText("OnlyMyPDF").first()).toBeVisible();
    await expect(page.getByText("Only4PDF")).toHaveCount(0);
  });

  test("privacy page uses OnlyMyPDF not Only4PDF", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByText("OnlyMyPDF").first()).toBeVisible();
    await expect(page.getByText("Only4PDF")).toHaveCount(0);
  });
});
