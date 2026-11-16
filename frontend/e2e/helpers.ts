import { expect, type APIRequestContext, type BrowserContext, type Page } from "@playwright/test";

/** Shared helpers for the E2E journeys. Synthetic data only; never point these at a shared API. */
export const API = process.env.E2E_API_BASE_URL ?? "http://localhost:8080";
export const PASSWORD = "correct-horse-battery";

export async function expectBackend(request: APIRequestContext) {
  const health = await request.get(`${API}/api/v1/health`).catch(() => null);
  expect(health?.ok(), `backend not reachable at ${API}; start it before running e2e tests`).toBe(true);
}

/** Next.js keeps recently visited routes in the DOM, hidden; only use visible elements. */
export function field(scope: Page | ReturnType<Page["locator"]>, label: string | RegExp) {
  return scope.getByLabel(label, { exact: typeof label === "string" }).filter({ visible: true });
}

export function button(scope: Page | ReturnType<Page["locator"]>, name: string | RegExp) {
  return scope.getByRole("button", { name, exact: typeof name === "string" }).filter({ visible: true });
}

export function visibleText(page: Page, text: string | RegExp) {
  return page.getByText(text).filter({ visible: true });
}

/** An open dialog by its title. */
export function dialog(page: Page, title: string | RegExp) {
  return page.getByRole("dialog", { name: title });
}

/** The toast that confirms a saved change. */
export function toast(page: Page) {
  return page.locator(".toast[role=status]");
}

/** A form or page alert, not Next.js's empty route announcer (also role="alert"). */
export function alertWith(page: Page, text: string | RegExp) {
  return page
    .getByRole("alert")
    .and(page.locator(":not(#__next-route-announcer__)"))
    .filter({ hasText: text })
    .filter({ visible: true });
}

export function uniqueEmail(tag = "user") {
  return `e2e-${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

export async function createAccount(page: Page, email: string) {
  await page.goto("/sign-up");
  await field(page, "Name").fill("E2E User");
  await field(page, "Email").fill(email);
  await field(page, "Password").fill(PASSWORD);
  await button(page, "Create account").click();
  await expect(page).toHaveURL(/\/sign-in\?notice=registered$/);
}

export async function signIn(page: Page, email: string, password = PASSWORD) {
  await field(page, "Email").fill(email);
  await field(page, "Password").fill(password);
  await button(page, "Sign in").click();
}

export async function registerAndSignIn(page: Page, email: string) {
  await createAccount(page, email);
  await signIn(page, email);
  await expect(page).toHaveURL(/\/dashboard$/);
}

/** Signs out through the sidebar and its confirmation dialog. */
export async function signOut(page: Page) {
  await button(page.locator(".sidebar"), "Sign out").click();
  await button(dialog(page, "Sign out of Divido?"), "Sign out").click();
  await expect(page).toHaveURL(/\/sign-in\?notice=signed-out$/);
}

export async function sessionCookie(context: BrowserContext) {
  return (await context.cookies(API)).find((cookie) => cookie.name.endsWith("DIVIDO_SESSION"));
}

/** A CSRF token for direct API calls made with this browser context's cookies. */
export async function csrf(request: APIRequestContext): Promise<string> {
  const response = await request.get(`${API}/api/v1/auth/csrf`);
  expect(response.ok()).toBe(true);
  return (await response.json()).token;
}

export async function apiPost(request: APIRequestContext, path: string, data: unknown) {
  return request.post(`${API}${path}`, { data, headers: { "X-XSRF-TOKEN": await csrf(request) } });
}

/** Records an expense through the add dialog (opened by its deep link). */
export async function addExpense(page: Page, amount: string, category: string, description?: string) {
  await page.goto("/transactions/new-expense");
  const form = dialog(page, "Record an expense");
  await field(form, /^Amount/).fill(amount);
  const select = field(form, /^Category/);
  await expect(select).toBeEnabled();
  await selectByText(select, `${category} · `);
  if (description) await field(form, /^Description/).fill(description);
  await button(form, "Save expense").click();
  await expect(toast(page)).toHaveText("Expense saved");
}

export async function addIncome(page: Page, amount: string, source?: string) {
  await page.goto("/transactions/new-income");
  const form = dialog(page, "Record income");
  await field(form, /^Amount/).fill(amount);
  if (source) {
    await expect(field(form, /^Income source/)).toBeEnabled();
    await field(form, /^Income source/).selectOption({ label: source });
  }
  await button(form, "Save income").click();
  await expect(toast(page)).toHaveText("Income added");
}

/** Chooses the option whose text starts with `prefix` (category options read "Name · Group"). */
export async function selectByText(select: ReturnType<Page["locator"]>, prefix: string) {
  const option = select.locator("option").filter({ hasText: prefix }).first();
  await select.selectOption(await option.getAttribute("value") ?? "");
}

/** Current month in Asia/Colombo, computed independently of the app's helpers. */
export function colomboMonth(offset = 0): { iso: string; label: string } {
  const now = new Date(Date.now() + (5 * 60 + 30) * 60_000); // UTC+05:30, no DST
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1));
  const iso = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  return { iso, label };
}
