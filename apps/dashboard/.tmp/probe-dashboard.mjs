import { chromium } from "/Users/akouta/Projects/academorix/refine-heroui-pro/node_modules/.pnpm/playwright-core@1.57.0/node_modules/playwright-core/index.mjs";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const errors = [];

page.on("pageerror", (e) => errors.push({ type: "pageerror", msg: e.message, stack: e.stack }));
page.on("console", (msg) => {
  if (msg.type() === "error") {
    errors.push({ type: "console", msg: msg.text() });
  }
});

try {
  await page.goto("http://localhost:3005/dashboard", { waitUntil: "networkidle", timeout: 20000 });
} catch (e) {
  errors.push({ type: "goto", msg: e.message });
}

await page.waitForTimeout(2500);

const html = await page.content();
const hasErrorText = html.includes("Something went wrong") || html.includes("nextResource");

console.log(
  JSON.stringify({ errors, hasErrorText, url: page.url(), title: await page.title() }, null, 2),
);

await browser.close();
