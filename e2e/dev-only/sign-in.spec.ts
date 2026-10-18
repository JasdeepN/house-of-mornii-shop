import { test, expect } from "@playwright/test";
import { requireDevTarget } from "../support/env";
import {
  TEST_CUSTOMER_EMAIL,
  useTestCustomerSession,
} from "../support/customer";

test.beforeAll(() => requireDevTarget());

test.describe("signed out", () => {
  test("Sign in leads to the hosted sign-in page and stops there", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Sign in" }).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Email").fill(TEST_CUSTOMER_EMAIL);
    await dialog.getByRole("button", { name: "CONTINUE" }).click();

    await page.waitForURL(/shopify\.com\/authentication/, { timeout: 60_000 });
    // Shopify's page may pre-fill the hint or ask for it; either way an Email field is shown. Never submit.
    await expect(
      page
        .locator(
          'input[type="email"], input[name="email"], input[autocomplete="email"]',
        )
        .first(),
    ).toBeVisible({
      timeout: 30_000,
    });
  });
});

test.describe("signed in with the saved session", () => {
  test.beforeEach(async ({ context }) => {
    if (!process.env.E2E_CUSTOMER_SESSION) {
      throw new Error(
        "E2E_CUSTOMER_SESSION is empty: refresh the saved session (see docs)",
      );
    }
    await useTestCustomerSession(context);
  });

  test("the header shows the Customer menu and Account details show the email", async ({
    page,
  }) => {
    await page.goto("/account");
    await expect(page.getByRole("heading", { name: /^HELLO,/ })).toBeVisible({
      timeout: 30_000,
    });
    // The menu button is labelled with the Customer's name or, without one, their email.
    await expect(page.getByRole("button", { name: "Sign in" })).toHaveCount(0);
    const menu = page
      .locator("button[aria-expanded]")
      .filter({ has: page.locator("div.rounded-full") });
    await expect(menu).toBeVisible();
    await menu.click();
    await expect(page.getByRole("link", { name: "Orders", exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Sign out" }),
    ).toBeVisible();

    await page.goto("/account/details");
    await expect(
      page.getByText(TEST_CUSTOMER_EMAIL, { exact: true }),
    ).toBeVisible({ timeout: 30_000 });
  });
});
