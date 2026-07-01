import puppeteer from "puppeteer";

const base = process.argv[2] || "http://localhost:3000";
const browser = await puppeteer.launch({ headless: false, args: ["--no-sandbox", "--window-size=1440,900"] });
const page = await browser.newPage();
const failed = [];
page.on("response", (res) => {
  const url = res.url();
  if (res.status() >= 400 && (url.includes("/_next/") || url.endsWith(".css") || url.endsWith(".js"))) {
    failed.push(`${res.status()} ${url}`);
  }
});
const jsErrors = [];
page.on("pageerror", (e) => jsErrors.push(e.message));

await page.goto(base, { waitUntil: "networkidle2", timeout: 60000 });

// Open All Tools mega menu
const allToolsBtn = await page.evaluateHandle(() =>
  [...document.querySelectorAll("button")].find((b) => b.textContent?.includes("All Tools"))
);
if (allToolsBtn) {
  await allToolsBtn.asElement()?.click();
  await new Promise((r) => setTimeout(r, 800));
}

const wordLink = await page.$('a[href="/word-to-pdf"]');
if (wordLink) {
  await Promise.all([page.waitForNavigation({ waitUntil: "networkidle2" }), wordLink.click()]);
  console.log("Navigated to:", page.url());
} else {
  console.log("Word to PDF link not found in menu");
}

await new Promise((r) => setTimeout(r, 1500));
const snapshot = await page.evaluate(() => ({
  url: location.href,
  title: document.title,
  cssLoaded: [...document.styleSheets].length,
  visibleText: document.body.innerText.includes("Convert to PDF"),
  rawKeys: document.body.innerText.match(/toolPage\.[a-zA-Z.]+/g),
}));
console.log("Snapshot:", JSON.stringify(snapshot, null, 2));
console.log("Failed assets:", failed.slice(0, 20));
console.log("JS errors:", jsErrors);

await page.screenshot({ path: "tmp-nav-test.png", fullPage: false });
await browser.close();
