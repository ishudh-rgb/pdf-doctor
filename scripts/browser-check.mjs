import puppeteer from "puppeteer";

const base = process.env.BASE_URL || "http://localhost:3000";
const paths = [
  "/",
  "/word-to-pdf",
  "/merge-pdf",
  "/all-tools",
  "/compress-pdf",
  "/pdf-to-word",
  "/sign-pdf",
];

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

const globalErrors = [];

page.on("pageerror", (err) => {
  globalErrors.push({ page: page.url(), type: "pageerror", msg: err.message });
});
page.on("console", (msg) => {
  if (msg.type() === "error") {
    globalErrors.push({ page: page.url(), type: "console", msg: msg.text() });
  }
});

for (const p of paths) {
  await page.goto(base + p, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1500));

  const info = await page.evaluate(() => {
    const main = document.getElementById("main-content");
    const overlay = document.querySelector("[data-design-preview-lab]");
    const heroSwitch = document.querySelector("[data-hero-variant-switch]");
    const buttons = [...document.querySelectorAll("button")].map((b) =>
      b.textContent?.trim().slice(0, 60)
    );
    const devOverlayText = document.body.innerText.includes("Design Preview");
    return {
      mainHeight: main?.offsetHeight ?? 0,
      hasDesignLab: !!overlay,
      hasHeroSwitch: !!heroSwitch,
      devOverlayText,
      buttonSamples: buttons.slice(0, 8),
      bodyLen: document.body.innerText.length,
    };
  });

  console.log(`\n=== ${p} ===`);
  console.log(JSON.stringify(info, null, 2));
}

console.log("\n=== GLOBAL ERRORS ===");
console.log(globalErrors.length ? JSON.stringify(globalErrors, null, 2) : "none");

await page.goto(base + "/all-tools", { waitUntil: "networkidle2" });
const hrefs = await page.$$eval("a[href]", (as) =>
  as
    .map((a) => a.getAttribute("href"))
    .filter((h) => h && /^\/[a-z0-9-]+$/.test(h) && !h.startsWith("/dashboard"))
);
const unique = [...new Set(hrefs)].sort();
console.log("\n=== ALL-TOOLS LINKS ===", unique.length);
for (const h of unique.slice(0, 30)) {
  const res = await page.goto(base + h, { waitUntil: "domcontentloaded", timeout: 30000 });
  const status = res?.status();
  const err = await page.evaluate(() => {
    const t = document.body?.innerText || "";
    return t.includes("Application error") || t.includes("Something went wrong");
  });
  console.log(status, h, err ? "APP_ERROR_TEXT" : "ok");
}

await browser.close();
