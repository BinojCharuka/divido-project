import { expect, test } from "@playwright/test";
import {
  alertWith,
  button,
  createAccount,
  dialog,
  expectBackend,
  field,
  PASSWORD,
  registerAndSignIn,
  sessionCookie,
  signIn,
  signOut,
  uniqueEmail,
  visibleText,
} from "./helpers";

/**
 * The authentication journeys in a real browser against the real backend, on
 * separate origins (localhost:3000 and the API), with HttpOnly cookies and CSRF.
 */
test.beforeAll(async ({ request }) => expectBackend(request));

/** The signed-in shell shows the email in the profile menu. */
async function expectSignedInAs(page: import("@playwright/test").Page, email: string) {
  await button(page, "Open profile menu").click();
  await expect(visibleText(page, email)).toBeVisible();
  await page.keyboard.press("Escape");
}

test("register, sign in, reload, sign out", async ({ page, context }) => {
  const email = uniqueEmail();
  await createAccount(page, email);

  // DEC-025: registration does not sign the user in.
  await expect(visibleText(page, "Your account has been created. Sign in to continue.")).toBeVisible();
  expect(await sessionCookie(context)).toBeUndefined();

  await signIn(page, email);
  await expect(page).toHaveURL(/\/dashboard$/);
  await expectSignedInAs(page, email);

  const cookie = await sessionCookie(context);
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");
  expect(await page.evaluate(() => document.cookie)).not.toContain("DIVIDO_SESSION");
  expect(await page.evaluate(() => document.cookie)).not.toContain("XSRF-TOKEN");
  // Only UI preferences may be stored in the browser; never session or financial data.
  const stored = await page.evaluate(() => [...Object.keys(localStorage), ...Object.keys(sessionStorage)]);
  expect(stored.filter((key) => !["divido-theme", "divido-sidebar-collapsed"].includes(key))).toEqual([]);

  // A reload restores the session through /me.
  await page.reload();
  await expectSignedInAs(page, email);

  await signOut(page);
  await expect(visibleText(page, "You have signed out.")).toBeVisible();
  // Signed out by a full page load: nothing of the signed-in page is left in the DOM.
  await expect(page.locator("body")).not.toContainText(email);

  // The old session no longer works.
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/sign-in$/);
});

test("wrong password shows the neutral message", async ({ page }) => {
  const email = uniqueEmail();
  await createAccount(page, email);
  await signIn(page, email, "not-the-password");

  await expect(alertWith(page, /\S/)).toHaveText("The email or password is incorrect.");
  await expect(page).toHaveURL(/\/sign-in/);
  await expect(field(page, "Password")).toHaveValue("");
});

test("an existing email gets the neutral conflict message", async ({ page }) => {
  const email = uniqueEmail();
  await createAccount(page, email);
  await page.goto("/sign-up");
  await field(page, "Name").fill("Someone Else");
  await field(page, "Email").fill(email);
  await field(page, "Password").fill(PASSWORD);
  await button(page, "Create account").click();

  await expect(alertWith(page, /\S/)).toContainText("We couldn't create an account with these details.");
  await expect(alertWith(page, /\S/)).not.toContainText(email);
});

test("protected pages without a session go to sign-in", async ({ page }) => {
  for (const path of ["/dashboard", "/transactions", "/budget", "/categories", "/income-sources", "/settings", "/insights"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/sign-in$/);
  }
  await expect(page.locator(".app-shell")).toHaveCount(0);
});

test("the old onboarding route opens the dashboard for a signed-in user", async ({ page }) => {
  await registerAndSignIn(page, uniqueEmail("onboarding"));
  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("an ended session returns the user to sign-in", async ({ page, context }) => {
  await registerAndSignIn(page, uniqueEmail("ended"));

  // Simulate expiry: the browser loses the session (as after an idle timeout or restart).
  await context.clearCookies({ name: /DIVIDO_SESSION$/ });
  await page.reload();

  await expect(page).toHaveURL(/\/sign-in$/);
});

test("a CSRF token made stale by another tab is replaced and the request retried once", async ({ page, context }) => {
  const email = uniqueEmail();
  await createAccount(page, email);

  // Tab A fetches a token with a failed attempt and keeps it in memory.
  await signIn(page, email, "not-the-password");
  await expect(alertWith(page, /\S/)).toHaveText("The email or password is incorrect.");

  // Tab B signs in, which makes the server replace the CSRF cookie.
  const other = await context.newPage();
  await other.goto("/sign-in");
  await signIn(other, email);
  await expect(other).toHaveURL(/\/dashboard$/);
  await other.close();

  const loginStatuses: number[] = [];
  page.on("response", (response) => {
    if (response.url().endsWith("/api/v1/auth/login")) loginStatuses.push(response.status());
  });
  await signIn(page, email);

  await expect(page).toHaveURL(/\/dashboard$/);
  expect(loginStatuses).toEqual([403, 200]);
});

test("sign-in and sign-out work with the keyboard alone", async ({ page }) => {
  const email = uniqueEmail();
  await createAccount(page, email);
  await page.goto("/sign-in");

  await field(page, "Email").focus();
  await page.keyboard.type(email);
  await page.keyboard.press("Tab");
  await expect(field(page, "Password")).toBeFocused();
  await page.keyboard.type("not-the-password");
  await page.keyboard.press("Enter");

  await expect(alertWith(page, /\S/)).toHaveText("The email or password is incorrect.");
  // Focus is not lost to the page body after the failed attempt.
  await expect(button(page, "Sign in")).toBeFocused();

  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(field(page, "Password")).toBeFocused();
  await page.keyboard.type(PASSWORD);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/dashboard$/);

  await button(page.locator(".sidebar"), "Sign out").focus();
  await page.keyboard.press("Enter");
  const confirm = dialog(page, "Sign out of Divido?");
  await expect(confirm).toBeVisible();
  await button(confirm, "Sign out").focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/sign-in\?notice=signed-out$/);
});
