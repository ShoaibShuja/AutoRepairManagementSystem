import { expect, test } from "@playwright/test";

test("shows the foundation landing page", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Operations foundation is ready." })).toBeVisible();
});
