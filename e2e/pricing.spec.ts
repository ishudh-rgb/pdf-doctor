import { test, expect } from "@playwright/test";

test.describe("Pricing", () => {
  test("pricing page shows Pro plan and OnlyMyPDF branding", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByText("OnlyMyPDF").first()).toBeVisible();
    await expect(page.getByText("₹299").first()).toBeVisible();
    await expect(page.getByText("₹2,399").first()).toBeVisible();
    await expect(page.getByText("Only4PDF")).toHaveCount(0);
  });

  test("dashboard pricing requires auth", async ({ page }) => {
    await page.goto("/dashboard/pricing");
    await expect(page).toHaveURL(/login/);
  });

  test("public pricing signup link targets dashboard pricing", async ({ page }) => {
    await page.goto("/pricing");
    const proLink = page.getByRole("link", { name: /Pro|Upgrade|Get Pro/i }).first();
    if (await proLink.isVisible()) {
      const href = await proLink.getAttribute("href");
      if (href?.includes("signup")) {
        expect(href).toContain("redirect=");
        expect(decodeURIComponent(href)).toContain("/dashboard/pricing");
      }
    }
  });

  test("pricing page includes Product JSON-LD", async ({ page }) => {
    await page.goto("/pricing");
    const ld = page.locator('script[type="application/ld+json"]');
    await expect(ld.first()).toBeAttached();
    const text = await ld.first().textContent();
    expect(text).toContain("Product");
    expect(text).toContain("2399");
  });
});
