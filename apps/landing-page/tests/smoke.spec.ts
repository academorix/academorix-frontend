import { expect, test } from "@playwright/test";

test("renders the index route", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("status")).toContainText("Analyzing requirements...");
  await expect(page.locator("header")).toHaveCount(0);
});

test("renders the not found route", async ({ page }) => {
  await page.goto("/missing");

  await expect(page.getByText("Page not found.")).toBeVisible();
});
