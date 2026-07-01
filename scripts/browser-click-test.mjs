import puppeteer from "puppeteer";

const base = process.env.BASE_URL || "http://localhost:3000";
const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
const issues = [];

page.on("console", (msg) => {
  const text = msg.text();
  if (
    /hydration|Hydration|error|Error|failed/i.test(text) &&
    !text.includes("favicon")
  ) {
    issues.push({ type: msg.type(), text });
  }
});
page.on("pageerror", (e) => issues.push({ type: "pageerror", text: e.message }));

await page.goto(`${base}/all-tools`, { waitUntil: "networkidle2", timeout: 120000 });

for (const b of await page.$$("button")) {
  const label = await page.evaluate((el) => el.textContent?.trim(), b);
  if (label === "Accept all") {
    await b.click();
    break;
  }
}
await new Promise((r) => setTimeout(r, 600));

await page.click('a.tool-card-ilove[href="/word-to-pdf"]');
await page.waitForFunction(() => location.pathname.endsWith("/word-to-pdf"), {
  timeout: 15000,
});

console.log("Navigated to:", page.url());
console.log(
  "Tool UI:",
  await page.evaluate(() => ({
    buttons: [...document.querySelectorAll("button")]
      .map((b) => b.textContent?.trim())
      .filter(Boolean),
    hasErrorText:
      document.body.innerText.includes("Application error") ||
      document.body.innerText.includes("Something went wrong"),
  }))
);
console.log("Console issues:", JSON.stringify(issues, null, 2));

await browser.close();
