import { expect, test, type APIRequestContext, type Page } from "@playwright/test";
import type { Transaction } from "../types/transaction";
import {
  addExpense,
  addIncome,
  alertWith,
  API,
  apiPost,
  button,
  csrf,
  dialog,
  expectBackend,
  field,
  registerAndSignIn,
  selectByText,
  signOut,
  toast,
  uniqueEmail,
  visibleText,
} from "./helpers";

/**
 * Phase 02 journeys in a real browser against the real backend and a disposable
 * database: transactions, filters, categories, income sources, ownership isolation,
 * CSRF, failed-write honesty and sign-out. Synthetic data only.
 */
test.beforeAll(async ({ request }) => expectBackend(request));

async function listViaApi(request: APIRequestContext, query = "") {
  const response = await request.get(`${API}/api/v1/transactions?size=100${query}`);
  expect(response.status()).toBe(200);
  return (await response.json()).items as Transaction[];
}

/** A row in the transaction list, found by its accessible name ("Title, expense of LKR …"). */
function row(page: Page, title: string) {
  return page.getByRole("button", { name: new RegExp(`^${title}, `) }).filter({ visible: true });
}

test("the design prototype is not served", async ({ page }) => {
  const response = await page.goto("/prototype");
  expect(response?.status()).toBe(404);
});

test("full transaction journey: create, list, filter, edit, delete", async ({ page }) => {
  await registerAndSignIn(page, uniqueEmail("journey"));

  await page.goto("/transactions");
  await expect(visibleText(page, /^No transactions in /)).toBeVisible();

  await addExpense(page, "1250.50", "Groceries", "Weekly shop");
  await addExpense(page, "800", "Transport", "Bus pass");

  // An income source is optional (DEC-003); add one to use in a filter.
  await page.goto("/income-sources");
  await button(page, "Add income source").click();
  const sourceForm = dialog(page, "Add income source");
  await field(sourceForm, /^Income source name/).fill("E2E Freelance");
  await button(sourceForm, "Save income source").click();
  await expect(page.getByRole("heading", { name: "E2E Freelance" })).toBeVisible();
  await addIncome(page, "45000", "E2E Freelance");
  await addIncome(page, "5000");

  // The list shows every record for the month, newest first, with server totals.
  await page.goto("/transactions");
  await expect(row(page, "Weekly shop")).toContainText("LKR 1,250.50");
  await expect(row(page, "Bus pass")).toBeVisible();
  await expect(visibleText(page, /^4 records/)).toBeVisible();

  // Filters run on the server.
  await button(page, "Expenses").click();
  await expect(row(page, "E2E Freelance")).toHaveCount(0);
  await expect(row(page, "Weekly shop")).toBeVisible();
  await button(page, "Income").click();
  await field(page, "Filter by income source").selectOption({ label: "E2E Freelance" });
  await expect(row(page, "E2E Freelance")).toBeVisible();
  await expect(row(page, "Income")).toHaveCount(0);
  await button(page, "Clear filters").first().click();
  await expect(visibleText(page, /^4 records/)).toBeVisible();

  // Edit sends only the changed fields; clearing the description stores null.
  await row(page, "Bus pass").click();
  await button(dialog(page, "Transaction details"), "Edit transaction").click();
  const edit = dialog(page, "Edit transaction");
  const patches: unknown[] = [];
  page.on("request", (request) => {
    if (request.method() === "PATCH") patches.push(request.postDataJSON());
  });
  await field(edit, /^Amount/).fill("2600");
  await field(edit, /^Description/).fill("");
  await button(edit, "Save changes").click();
  await expect(toast(page)).toHaveText("Transaction updated");
  expect(patches).toEqual([{ amount: "2600.00", description: null }]);
  await expect(row(page, "Transport")).toContainText("LKR 2,600.00");

  // Deleting asks first and removes the record on the server.
  const [bus] = (await listViaApi(page.request)).filter((t) => t.amount === "2600.00");
  await row(page, "Transport").click();
  await button(dialog(page, "Transaction details"), "Delete").click();
  await button(dialog(page, "Delete this expense?"), "Delete expense").click();
  await expect(toast(page)).toHaveText("Transaction deleted");
  await expect(row(page, "Transport")).toHaveCount(0);
  expect((await page.request.get(`${API}/api/v1/transactions/${bus.id}`)).status()).toBe(404);

  // The old edit link for a deleted record says so instead of showing anything.
  await page.goto(`/transactions/${bus.id}/edit`);
  await expect(toast(page)).toHaveText("That transaction no longer exists.");
  await expect(page).toHaveURL(/\/transactions$/);
});

test("category management: built-ins are read-only, custom categories are usable", async ({ page }) => {
  await registerAndSignIn(page, uniqueEmail("categories"));
  await page.goto("/categories");

  for (const name of ["Groceries", "Transport", "Entertainment"]) {
    const card = page.locator("li.category-card").filter({ has: page.getByRole("heading", { name, exact: true }) });
    await expect(card).toContainText("Built-in categories can’t be changed");
    await expect(card.getByRole("button")).toHaveCount(0);
  }

  await button(page, "Add category").click();
  const form = dialog(page, "Add category");
  await field(form, /^Category name/).fill("E2E Books");
  await field(form, "Spending group").selectOption("CULTURE");
  await button(form, "Save category").click();
  await expect(page.getByRole("heading", { name: "E2E Books" })).toBeVisible();

  await addExpense(page, "1500", "E2E Books", "Novel");
  const [novel] = await listViaApi(page.request);
  expect(novel.category).toMatchObject({ name: "E2E Books", group: "CULTURE" });

  // A deactivated category stays on its records but is not offered for new ones.
  await page.goto("/categories");
  await button(page, "Deactivate E2E Books").click();
  await button(dialog(page, "Deactivate E2E Books?"), "Deactivate").click();
  await expect(page.getByRole("heading", { name: "E2E Books" })).toHaveCount(0);

  await page.goto("/transactions/new-expense");
  const select = field(dialog(page, "Record an expense"), /^Category/);
  await expect(select).toBeEnabled();
  await expect(select.locator("option", { hasText: "E2E Books" })).toHaveCount(0);
  expect((await listViaApi(page.request))[0].category?.name).toBe("E2E Books");
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

    // The edit link says the record does not exist and never shows A's data
    await b.goto(`/transactions/${tx.id}/edit`);
    await expect(toast(b)).toHaveText("That transaction no longer exists.");
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
  const form = dialog(page, "Record an expense");
  await field(form, /^Amount/).fill("100");
  await expect(field(form, /^Category/)).toBeEnabled();
  await selectByText(field(form, /^Category/), "Groceries · ");
  await button(form, "Save expense").click();

  await expect(alertWith(page, "Something went wrong on our side.")).toBeVisible();
  await expect(toast(page)).toHaveCount(0);
  // The entered values remain for a safe retry; nothing was stored anywhere.
  await expect(field(form, /^Amount/)).toHaveValue("100");
  await page.unroute(`${API}/api/v1/transactions`);
  expect(await listViaApi(page.request)).toHaveLength(0);
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
  const session = (await page.context().cookies(API)).find((c) => c.name.endsWith("DIVIDO_SESSION"))!;

  await signOut(page);
  expect((await page.request.get(`${API}/api/v1/transactions`)).status()).toBe(401);

  // Replaying the old session cookie does not work either.
  await page.context().addCookies([session]);
  expect((await page.request.get(`${API}/api/v1/transactions`)).status()).toBe(401);
  await page.goto("/transactions");
  await expect(page).toHaveURL(/\/sign-in$/);
});
