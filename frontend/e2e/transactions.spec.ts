import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import type { Transaction } from "../types/transaction";

/**
 * Phase 02 journeys (DIV-015) in a real browser against the real backend and a
 * disposable database: transactions, filters, categories, income sources,
 * ownership isolation, CSRF, failed-write honesty and logout. Synthetic data only.
 */
const API = process.env.E2E_API_BASE_URL ?? "http://localhost:8080";
const PASSWORD = "correct-horse-battery";

test.beforeAll(async ({ request }) => {
  const health = await request.get(`${API}/api/v1/health`).catch(() => null);
  expect(health?.ok(), `backend not reachable at ${API}; start it before running e2e tests`).toBe(true);
});

/** Next.js keeps recently visited routes in the DOM, hidden; only use visible elements. */
function field(page: Page, label: string | RegExp) {
  return page.getByLabel(label, { exact: typeof label === "string" }).filter({ visible: true });
}

function button(page: Page, name: string | RegExp) {
  return page.getByRole("button", { name, exact: typeof name === "string" }).filter({ visible: true });
}

function visibleText(page: Page, text: string | RegExp) {
  return page.getByText(text).filter({ visible: true });
}

function uniqueEmail(tag: string) {
  return `e2e-${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

async function registerAndSignIn(page: Page, email: string) {
  await page.goto("/sign-up");
  await field(page, "Name").fill("E2E User");
  await field(page, "Email").fill(email);
  await field(page, "Password").fill(PASSWORD);
  await button(page, "Create account").click();
  await expect(page).toHaveURL(/\/sign-in\?notice=registered$/);
  await field(page, "Email").fill(email);
  await field(page, "Password").fill(PASSWORD);
  await button(page, "Sign in").click();
  await expect(page).toHaveURL(/\/onboarding$/);
}

/** A CSRF token for direct API calls made with this browser context's cookies. */
async function csrf(request: APIRequestContext): Promise<string> {
  const response = await request.get(`${API}/api/v1/auth/csrf`);
  expect(response.ok()).toBe(true);
  return (await response.json()).token;
}

async function apiPost(request: APIRequestContext, path: string, data: unknown) {
  return request.post(`${API}${path}`, { data, headers: { "X-XSRF-TOKEN": await csrf(request) } });
}

async function addExpense(page: Page, amount: string, category: string, description: string) {
  await page.goto("/transactions/new-expense");
  await field(page, "Amount *").fill(amount);
  const select = field(page, "Category *");
  await expect(select).toBeEnabled();
  await select.selectOption({ label: category });
  await field(page, "Description (optional)").fill(description);
  await button(page, "Save expense").click();
  await expect(page).toHaveURL(/\/transactions\?notice=expense-saved$/);
  await expect(visibleText(page, "Expense saved successfully.")).toBeVisible();
}

async function addIncome(page: Page, amount: string, description: string, source?: string) {
  await page.goto("/transactions/new-income");
  await field(page, "Amount *").fill(amount);
  const select = field(page, "Income Source (optional)");
  await expect(select).toBeEnabled();
  if (source) await select.selectOption({ label: source });
  await field(page, "Description (optional)").fill(description);
  await button(page, "Save income").click();
  await expect(page).toHaveURL(/\/transactions\?notice=income-saved$/);
}

async function listViaApi(request: APIRequestContext, query = "") {
  const response = await request.get(`${API}/api/v1/transactions?size=100${query}`);
  expect(response.status()).toBe(200);
  return (await response.json()).items as Transaction[];
}

test("protected Phase 02 routes require a session", async ({ page }) => {
  for (const path of ["/transactions", "/transactions/new-expense", "/categories", "/income-sources", "/dashboard"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/sign-in$/);
  }
});

test("the design prototype is not served by the production build", async ({ page }) => {
  const response = await page.goto("/prototype");
  expect(response?.status()).toBe(404);
});

test("full transaction journey: create, list, filter, edit, delete", async ({ page }) => {
  await registerAndSignIn(page, uniqueEmail("tx"));

  await page.goto("/transactions");
  await expect(visibleText(page, "No transactions recorded this month")).toBeVisible();

  // Expense creation and listing
  await addExpense(page, "2400", "Groceries", "E2E weekly rice");
  await expect(visibleText(page, "E2E weekly rice")).toBeVisible();
  await expect(visibleText(page, "LKR 2,400.00").first()).toBeVisible();

  // Income without a source (DEC-003)
  await addIncome(page, "50000", "E2E salary no source");
  await expect(visibleText(page, "E2E salary no source")).toBeVisible();

  // Income source management, then income with that source
  await page.goto("/income-sources");
  await field(page, "Income source name").fill("E2E Freelance");
  await button(page, "Add income source").click();
  await expect(visibleText(page, 'Income source "E2E Freelance" created.')).toBeVisible();
  await addIncome(page, "12000", "E2E freelance gig", "E2E Freelance");
  await expect(visibleText(page, "E2E freelance gig")).toBeVisible();

  const items = await listViaApi(page.request);
  expect(items).toHaveLength(3);
  expect(items.find((t) => t.description === "E2E freelance gig")?.incomeSource?.name).toBe("E2E Freelance");
  expect(items.find((t) => t.description === "E2E salary no source")?.incomeSource).toBeNull();

  // Filters: type, income source, clear
  await page.goto("/transactions");
  await expect(visibleText(page, "E2E weekly rice")).toBeVisible();
  await page.getByRole("tab", { name: "Expenses" }).filter({ visible: true }).click();
  await expect(visibleText(page, "E2E weekly rice")).toBeVisible();
  await expect(visibleText(page, "E2E freelance gig")).toHaveCount(0);

  await page.getByRole("tab", { name: "Income" }).filter({ visible: true }).click();
  await field(page, "Income source:").selectOption({ label: "E2E Freelance" });
  await expect(visibleText(page, "E2E freelance gig")).toBeVisible();
  await expect(visibleText(page, "E2E salary no source")).toHaveCount(0);
  await expect(visibleText(page, "E2E weekly rice")).toHaveCount(0);

  await button(page, "Clear filters").first().click();
  await expect(visibleText(page, "E2E weekly rice")).toBeVisible();
  await expect(visibleText(page, "E2E salary no source")).toBeVisible();

  // Edit: change the amount and clear the description
  await visibleText(page, "E2E weekly rice").click();
  await expect(page).toHaveURL(/\/transactions\/[0-9a-f-]+\/edit$/);
  const editUrl = page.url();
  await field(page, "Amount *").fill("2600");
  await field(page, "Description (optional)").fill("");
  await button(page, "Save changes").click();
  await expect(page).toHaveURL(/\/transactions\?notice=updated$/);
  await expect(visibleText(page, "Transaction updated.")).toBeVisible();

  const expenseId = editUrl.match(/transactions\/([0-9a-f-]+)\/edit/)![1];
  const edited = await (await page.request.get(`${API}/api/v1/transactions/${expenseId}`)).json();
  expect(edited.amount).toBe("2600.00");
  expect(edited.description).toBeNull();

  // Delete (DEC-014: hard delete, 204)
  await page.goto(editUrl);
  await button(page, "Delete").click();
  const deleteResponse = page.waitForResponse(
    (r) => r.url().endsWith(`/api/v1/transactions/${expenseId}`) && r.request().method() === "DELETE",
  );
  await button(page, "Yes, delete").click();
  expect((await deleteResponse).status()).toBe(204);
  await expect(page).toHaveURL(/\/transactions\?notice=deleted$/);
  expect((await page.request.get(`${API}/api/v1/transactions/${expenseId}`)).status()).toBe(404);
  expect(await listViaApi(page.request)).toHaveLength(2);
});

test("category management: defaults are read-only, custom categories are usable", async ({ page }) => {
  await registerAndSignIn(page, uniqueEmail("cat"));
  await page.goto("/categories");

  const defaults = page.getByRole("region", { name: "Default categories" }).filter({ visible: true });
  await expect(defaults.getByText("Groceries")).toBeVisible();
  await expect(defaults.getByRole("button")).toHaveCount(0);

  await field(page, "Category name").fill("E2E Books");
  await field(page, "Kakeibo group").selectOption("CULTURE");
  await button(page, "Add category").click();
  await expect(visibleText(page, 'Category "E2E Books" created.')).toBeVisible();

  await addExpense(page, "1500", "E2E Books", "E2E novel");

  // Deactivated categories are no longer offered for new expenses.
  await page.goto("/categories");
  await button(page, "Deactivate E2E Books").click();
  await button(page, "Deactivate").click();
  await expect(visibleText(page, 'Category "E2E Books" deactivated.')).toBeVisible();
  await page.goto("/transactions/new-expense");
  await expect(field(page, "Category *")).toBeEnabled();
  await expect(field(page, "Category *").locator("option", { hasText: "E2E Books" })).toHaveCount(0);

  // Global defaults cannot be changed through the API either (DEC-013).
  const categories = (await (await page.request.get(`${API}/api/v1/categories`)).json()).items as Array<{ id: string; isDefault: boolean }>;
  const groceries = categories.find((c) => c.isDefault)!;
  const forbidden = await page.request.patch(`${API}/api/v1/categories/${groceries.id}`, {
    data: { name: "Hacked" },
    headers: { "X-XSRF-TOKEN": await csrf(page.request) },
  });
  expect(forbidden.status()).toBe(403);
});

test("users cannot reach another user's transactions, categories or income sources", async ({ browser }) => {
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const a = await contextA.newPage();
  const b = await contextB.newPage();
  try {
    await registerAndSignIn(a, uniqueEmail("owner"));
    const category = await (await apiPost(a.request, "/api/v1/categories", { name: "A private", group: "WANTS" })).json();
    const source = await (await apiPost(a.request, "/api/v1/income-sources", { name: "A source" })).json();
    const tx = await (
      await apiPost(a.request, "/api/v1/transactions", { type: "EXPENSE", amount: "99.00", date: "2026-10-01", categoryId: category.id, description: "A secret" })
    ).json();

    await registerAndSignIn(b, uniqueEmail("other"));

    // Read, edit, delete A's transaction as B
    expect((await b.request.get(`${API}/api/v1/transactions/${tx.id}`)).status()).toBe(404);
    const token = await csrf(b.request);
    expect((await b.request.patch(`${API}/api/v1/transactions/${tx.id}`, { data: { amount: "1.00" }, headers: { "X-XSRF-TOKEN": token } })).status()).toBe(404);
    expect((await b.request.delete(`${API}/api/v1/transactions/${tx.id}`, { headers: { "X-XSRF-TOKEN": token } })).status()).toBe(404);
    expect(await listViaApi(b.request)).toHaveLength(0);

    // The edit page shows not-found, never A's data
    await b.goto(`/transactions/${tx.id}/edit`);
    await expect(visibleText(b, "Transaction not found or could not be loaded.")).toBeVisible();
    await expect(b.locator("body")).not.toContainText("A secret");

    // Using A's category or income source as B is rejected
    const withCategory = await apiPost(b.request, "/api/v1/transactions", { type: "EXPENSE", amount: "5.00", date: "2026-10-01", categoryId: category.id });
    expect(withCategory.status()).toBe(400);
    expect((await withCategory.json()).fieldErrors.categoryId).toBeTruthy();
    const withSource = await apiPost(b.request, "/api/v1/transactions", { type: "INCOME", amount: "5.00", date: "2026-10-01", incomeSourceId: source.id });
    expect(withSource.status()).toBe(400);
    expect((await withSource.json()).fieldErrors.incomeSourceId).toBeTruthy();
    expect((await b.request.patch(`${API}/api/v1/categories/${category.id}`, { data: { name: "x" }, headers: { "X-XSRF-TOKEN": await csrf(b.request) } })).status()).toBe(404);
    expect((await apiPost(b.request, `/api/v1/income-sources/${source.id}/deactivate`, undefined)).status()).toBe(404);

    // A's record is untouched
    const stillThere = await (await a.request.get(`${API}/api/v1/transactions/${tx.id}`)).json();
    expect(stillThere.amount).toBe("99.00");
  } finally {
    await contextA.close();
    await contextB.close();
  }
});

test("a failed backend write never shows success", async ({ page }) => {
  await registerAndSignIn(page, uniqueEmail("fail"));

  await page.route(`${API}/api/v1/transactions`, (route) =>
    route.request().method() === "POST"
      ? route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ status: 500, code: "INTERNAL_ERROR", message: "Something went wrong on our side. Please try again." }) })
      : route.continue(),
  );

  await page.goto("/transactions/new-expense");
  await field(page, "Amount *").fill("100");
  await expect(field(page, "Category *")).toBeEnabled();
  await field(page, "Category *").selectOption({ label: "Groceries" });
  await button(page, "Save expense").click();

  await expect(page.getByRole("alert").filter({ hasText: "Something went wrong on our side." })).toBeVisible();
  await expect(page).toHaveURL(/\/transactions\/new-expense$/);
  await expect(visibleText(page, "Expense saved successfully.")).toHaveCount(0);
  // The entered values remain for a safe retry; nothing was stored anywhere.
  await expect(field(page, "Amount *")).toHaveValue("100");
  await page.unroute(`${API}/api/v1/transactions`);
  expect(await listViaApi(page.request)).toHaveLength(0);
  expect(await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith("divido-")))).toEqual([]);
});

test("state-changing requests without a CSRF token are rejected", async ({ page }) => {
  await registerAndSignIn(page, uniqueEmail("csrf"));
  const response = await page.request.post(`${API}/api/v1/transactions`, {
    data: { type: "INCOME", amount: "10.00", date: "2026-10-01" },
  });
  expect(response.status()).toBe(403);
  expect((await response.json()).code).toBe("CSRF_INVALID");
  expect(await listViaApi(page.request)).toHaveLength(0);
});

test("signing out invalidates the session for the transaction API", async ({ page }) => {
  await registerAndSignIn(page, uniqueEmail("logout"));
  await page.goto("/transactions");
  expect((await page.request.get(`${API}/api/v1/transactions`)).status()).toBe(200);
  const cookies = await page.context().cookies(API);
  const session = cookies.find((c) => c.name.endsWith("DIVIDO_SESSION"))!;

  await button(page, "Sign out").first().click();
  await expect(page).toHaveURL(/\/sign-in\?notice=signed-out$/);
  expect((await page.request.get(`${API}/api/v1/transactions`)).status()).toBe(401);

  // Replaying the old session cookie does not work either.
  await page.context().addCookies([session]);
  expect((await page.request.get(`${API}/api/v1/transactions`)).status()).toBe(401);
  await page.goto("/transactions");
  await expect(page).toHaveURL(/\/sign-in$/);
});
