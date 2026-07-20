import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for the academorix-frontend workspace.
 *
 * Targets the vite-template app by default (the dashboard app was
 * retired in the workspace reorg). Override `PLAYWRIGHT_TARGET` to
 * point at a different workspace app, and `PLAYWRIGHT_BASE_URL` to
 * hit a running preview directly.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 4173);
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;
const target = process.env.PLAYWRIGHT_TARGET ?? "vite-template";

const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  // CI: emit both list output (for logs) + JUnit XML (for GitHub summaries);
  // local: HTML report opens on failure.
  reporter: isCI
    ? [
        ["list"],
        ["junit", { outputFile: "playwright-report/junit.xml" }],
        ["html", { open: "never" }],
      ]
    : [["list"], ["html", { open: "on-failure" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: `pnpm --filter ${target} preview --port ${PORT} --strictPort`,
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
