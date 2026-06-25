import { test, expect } from "@playwright/test";
import { dismissCookieBanner } from "./helpers";

test.describe("Public smoke", () => {
  test("health API returns ok", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { status?: string };
    expect(body.status).toBeTruthy();
  });

  test("homepage loads with hero above AEO footer", async ({ page }) => {
    await page.goto("/");
    await dismissCookieBanner(page);

    await expect(page.locator("#main-content")).toBeVisible();
    const mainText = await page.locator("#main-content").innerText();

    const heroMarker =
      mainText.includes("Every PDF tool") ||
      mainText.includes("PDF tool") ||
      mainText.includes("Choose a PDF Tool");
    expect(heroMarker).toBeTruthy();

    const aeoIdx = mainText.indexOf("About OnlyMyPDF");
    if (aeoIdx >= 0) {
      const heroIdx = Math.min(
        ...["Every PDF tool", "Choose a PDF Tool", "PDF tool"]
          .map((s) => mainText.indexOf(s))
          .filter((i) => i >= 0)
      );
      expect(heroIdx).toBeLessThan(aeoIdx);
    }
  });

  test("robots.txt and sitemap.xml are reachable", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.ok()).toBeTruthy();
    expect(await robots.text()).toContain("Sitemap");

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.ok()).toBeTruthy();
    expect(await sitemap.text()).toContain("<urlset");
  });
});
