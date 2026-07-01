import puppeteer from "puppeteer";

const base = process.env.BASE_URL || "http://localhost:3000";
const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

const pages = ["/all-tools", "/word-to-pdf", "/merge-pdf", "/"];
for (const p of pages) {
  await page.goto(base + p, { waitUntil: "networkidle2", timeout: 60000 });
  const info = await page.evaluate(() => {
    const text = document.body?.innerText || "";
    const raw = text.match(/\b(?:tools|toolPage|landing|nav|dashboard)\.[a-zA-Z0-9.]+/g) || [];
    const stylesheets = [...document.styleSheets].length;
    const bg = getComputedStyle(document.body).backgroundColor;
    const main = document.getElementById("main-content");
    return {
      rawKeys: [...new Set(raw)],
      stylesheets,
      bodyBg: bg,
      mainHeight: main?.offsetHeight ?? 0,
      hasConvertBtn: text.includes("Convert to PDF") || text.includes("Merge") || text.includes("All PDF Tools"),
    };
  });
  console.log(p, JSON.stringify(info));
}

// Click word-to-pdf from all-tools grid
await page.goto(base + "/all-tools", { waitUntil: "networkidle2" });
const href = await page.$eval('a[href="/word-to-pdf"]', (a) => a.getAttribute("href"));
console.log("word-to-pdf href:", href);
await Promise.all([
  page.waitForNavigation({ waitUntil: "networkidle2" }),
  page.click('a[href="/word-to-pdf"]'),
]);
console.log("landed:", page.url());
const wt = await page.evaluate(() => ({
  title: document.title,
  buttons: [...document.querySelectorAll("button")].map((b) => b.textContent?.trim()).filter(Boolean),
}));
console.log("word-to-pdf after click:", JSON.stringify(wt));

await browser.close();
