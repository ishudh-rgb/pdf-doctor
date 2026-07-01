import puppeteer from "puppeteer";

const base = process.argv[2] || "http://localhost:3000";
const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

await page.goto(base + "/word-to-pdf", { waitUntil: "networkidle2", timeout: 60000 });
await page.click('button:has-text("HI")').catch(async () => {
  const hi = await page.$('[aria-label*="Hindi"], button');
  const buttons = await page.$$("button");
  for (const b of buttons) {
    const t = await page.evaluate((el) => el.textContent, b);
    if (t?.trim() === "HI") {
      await b.click();
      break;
    }
  }
});
await new Promise((r) => setTimeout(r, 2000));
const afterHi = await page.evaluate(() => ({
  lang: document.documentElement.lang,
  buttons: [...document.querySelectorAll("button")].map((b) => b.textContent?.trim()).slice(0, 12),
  hasBrokenText: document.body.innerText.includes("toolPage."),
  bodySample: document.body.innerText.slice(0, 500),
}));
console.log("After HI:", JSON.stringify(afterHi, null, 2));
console.log("Errors:", errors);

await page.goto(base + "/all-tools", { waitUntil: "networkidle2" });
const cards = await page.$$eval("a[href*='/word-to-pdf'], a[href*='/merge-pdf']", (els) =>
  els.slice(0, 5).map((el) => ({
    href: el.getAttribute("href"),
    rect: el.getBoundingClientRect(),
    display: getComputedStyle(el).display,
    pointerEvents: getComputedStyle(el).pointerEvents,
  }))
);
console.log("Card links:", JSON.stringify(cards, null, 2));

await browser.close();
