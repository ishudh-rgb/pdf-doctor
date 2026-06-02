import puppeteer, { type Browser } from "puppeteer";

let browserInstance: Browser | null = null;
let browserUses = 0;
const MAX_USES_BEFORE_RESTART = 40;

const LAUNCH_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-gpu",
  "--no-first-run",
  "--disable-extensions",
];

export async function getPuppeteerBrowser(): Promise<Browser> {
  if (browserInstance?.connected) {
    browserUses += 1;
    if (browserUses <= MAX_USES_BEFORE_RESTART) {
      return browserInstance;
    }
    await browserInstance.close().catch(() => {});
    browserInstance = null;
    browserUses = 0;
  }

  browserInstance = await puppeteer.launch({
    headless: true,
    args: LAUNCH_ARGS,
  });
  browserUses = 1;
  return browserInstance;
}

export async function closePuppeteerBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close().catch(() => {});
    browserInstance = null;
    browserUses = 0;
  }
}
