import { expect, test } from "@playwright/test";

test.describe("home page", () => {
  test("renders the Academorix landing page", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Academorix")).toBeVisible();
    await expect(page.getByRole("button", { name: /get started/i })).toBeVisible();
  });
});
