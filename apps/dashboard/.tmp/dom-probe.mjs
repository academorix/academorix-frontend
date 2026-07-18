import { chromium } from "/Users/akouta/Projects/academorix/refine-heroui-pro/node_modules/.pnpm/playwright-core@1.57.0/node_modules/playwright-core/index.mjs";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

try {
  await page.goto("http://localhost:3005/dashboard", { waitUntil: "networkidle", timeout: 20000 });
} catch (e) {}

await page.waitForTimeout(2500);

const outerHTML = await page.evaluate(() => {
  const app = document.querySelector("#root");

  return app ? app.outerHTML.slice(0, 4000) : "(no #root)";
});

console.log(outerHTML);

await browser.close();
