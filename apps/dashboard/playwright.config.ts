/**
 * @file apps/dashboard/playwright.config.ts
 *
 * @description
 * App-specific Playwright config for the tenant dashboard. Extends
 * the monorepo-wide `playwright.base.config.ts` (browser matrix,
 * timeouts, reporters) and only declares what's app-specific:
 * baseURL, dev-server command, and the tests directory.
 *
 * Run:
 *   cd apps/dashboard
 *   pnpm exec playwright test              — all specs
 *   pnpm exec playwright test --ui         — interactive UI mode
 *   pnpm exec playwright test --grep smoke — filter by tag
 */

import { defineConfig } from "@playwright/test";

import base from "../../playwright.base.config";

const PORT = Number(process.env.PORT ?? 3000);
const BASE_URL = process.env.BASE_URL ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
  ...base,
  testDir: "./tests/e2e",
  use: {
    ...base.use,
    baseURL: BASE_URL,
  },
  webServer: {
    command: "pnpm run dev",
    url: BASE_URL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
    stderr: "pipe",
  },
});
