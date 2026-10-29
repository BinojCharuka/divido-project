import { expect, test, type BrowserContext, type Page } from "@playwright/test";

/**
 * The authentication journeys in a real browser against the real backend, on
 * separate origins (localhost:3000 and the API), with HttpOnly cookies and CSRF.
 */
const API = process.env.E2E_API_BASE_URL ?? "http://localhost:8080";
const PASSWORD = "correct-horse-battery";

test.beforeAll(async ({ request }) => {
  const health = await request.get(`${API}/api/v1/health`).catch(() => null);
  expect(health?.ok(), `backend not reachable at ${API}; start it before running e2e tests`).toBe(true);
});

/** Next.js keeps recently visited routes in the DOM, hidden; only use the visible field. */
function field(page: Page, label: string) {
  return page.getByLabel(label, { exact: true }).filter({ visible: true });
}

/** The form's alert, not Next.js's empty route announcer (also role="alert"). */
function formAlert(page: Page) {
  return page.getByRole("alert").filter({ hasText: /\S/ });
}

function uniqueEmail() {
  return `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

async function createAccount(page: Page, email: string) {
  await page.goto("/sign-up");
  await field(page, "Name").fill("E2E User");
  await field(page, "Email").fill(email);
  await field(page, "Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/sign-in\?notice=registered$/);
}

async function signIn(page: Page, email: string, password = PASSWORD) {
  await field(page, "Email").fill(email);
  await field(page, "Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

async function sessionCookie(context: BrowserContext) {
  return (await context.cookies(API)).find((cookie) => cookie.name.endsWith("DIVIDO_SESSION"));
}

test("register, sign in, reload, sign out", async ({ page, context }) => {
  const email = uniqueEmail();
  await createAccount(page, email);

  // DEC-025: registration does not sign the user in.
  await expect(page.getByText("Your account has been created. Sign in to continue.")).toBeVisible();
  expect(await sessionCookie(context)).toBeUndefined();

  await signIn(page, email);
  await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByText(email)).toBeVisible();

  const cookie = await sessionCookie(context);
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Lax");
  expect(await page.evaluate(() => document.cookie)).not.toContain("DIVIDO_SESSION");
  expect(await page.evaluate(() => document.cookie)).not.toContain("XSRF-TOKEN");
  expect(await page.evaluate(() => localStorage.length + sessionStorage.length)).toBe(0);

  // A reload restores the session through /me.
  await page.reload();
  await expect(page.getByText(email)).toBeVisible();

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/sign-in\?notice=signed-out$/);
  await expect(page.getByText("You have signed out.")).toBeVisible();
  // Signed out by a full page load: nothing of the signed-in page is left in the DOM.
  await expect(page.locator("body")).not.toContainText(email);

  // The old session no longer works.
  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/sign-in$/);
});

test("wrong password shows the neutral message", async ({ page }) => {
  const email = uniqueEmail();
  await createAccount(page, email);
  await signIn(page, email, "not-the-password");

  await expect(formAlert(page)).toHaveText("The email or password is incorrect.");
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
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(formAlert(page)).toContainText("We couldn't create an account with these details.");
  await expect(formAlert(page)).not.toContainText(email);
});

test("a protected page without a session goes to sign-in", async ({ page }) => {
  await page.goto("/onboarding");
  await expect(page).toHaveURL(/\/sign-in$/);
  await expect(page.getByText(/signed in as/)).toHaveCount(0);
});

test("an ended session returns the user to sign-in", async ({ page, context }) => {
  const email = uniqueEmail();
  await createAccount(page, email);
  await signIn(page, email);
  await expect(page).toHaveURL(/\/onboarding$/);

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
  await expect(formAlert(page)).toHaveText("The email or password is incorrect.");

  // Tab B signs in, which makes the server replace the CSRF cookie.
  const other = await context.newPage();
  await other.goto("/sign-in");
  await signIn(other, email);
  await expect(other).toHaveURL(/\/onboarding$/);
  await other.close();

  const loginStatuses: number[] = [];
  page.on("response", (response) => {
    if (response.url().endsWith("/api/v1/auth/login")) loginStatuses.push(response.status());
  });
  await signIn(page, email);

  await expect(page).toHaveURL(/\/onboarding$/);
  expect(loginStatuses).toEqual([403, 200]);
});

test("sign-in works with the keyboard alone", async ({ page }) => {
  const email = uniqueEmail();
  await createAccount(page, email);
  await page.goto("/sign-in");

  await field(page, "Email").focus();
  await page.keyboard.type(email);
  await page.keyboard.press("Tab");
  await expect(field(page, "Password")).toBeFocused();
  await page.keyboard.type("not-the-password");
  await page.keyboard.press("Enter");

  await expect(formAlert(page)).toHaveText("The email or password is incorrect.");
  // Focus is not lost to the page body after the failed attempt.
  await expect(page.getByRole("button", { name: "Sign in" })).toBeFocused();

  await page.keyboard.press("Shift+Tab");
  await expect(field(page, "Password")).toBeFocused();
  await page.keyboard.type(PASSWORD);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/onboarding$/);

  await page.getByRole("button", { name: "Sign out" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/sign-in\?notice=signed-out$/);
});
