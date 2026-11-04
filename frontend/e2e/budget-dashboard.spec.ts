import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

/**
 * Phase 03 journeys (DIV-025, DIV-026) in a real browser against the real backend and
 * a disposable database. Synthetic data only. Expected figures are worked out by hand
 * below, never by calling the production calculation code.
 *
 * Plan: income 100,000.00, savings 15,000.00, NEEDS 40,000.00, WANTS 20,000.00,
 *       CULTURE 10,000.00, UNEXPECTED 5,000.00 -> groups 75,000.00, planned 90,000.00,
 *       10,000.00 not yet planned.
 * Expenses: Groceries 12,500.25 (NEEDS) -> remaining 27,499.75, 31.3% used
 *           Entertainment 25,000.00 (WANTS) -> over by 5,000.00, 125.0% used
 * Income: 60,000.00. Total spent 37,500.25.
 */
const API = process.env.E2E_API_BASE_URL ?? "http://localhost:8080";
const PASSWORD = "correct-horse-battery";

test.beforeAll(async ({ request }) => {
  const health = await request.get(`${API}/api/v1/health`).catch(() => null);
  expect(health?.ok(), `backend not reachable at ${API}; start it before running e2e tests`).toBe(true);
});

/** Next.js keeps recently visited routes in the DOM, hidden; only use visible elements. */
function field(page: Page, label: string) {
  return page.getByLabel(label, { exact: true }).filter({ visible: true });
}

function button(page: Page, name: string | RegExp) {
  return page.getByRole("button", { name, exact: typeof name === "string" }).filter({ visible: true });
}

function visibleText(page: Page, text: string | RegExp) {
  return page.getByText(text).filter({ visible: true });
}

function group(page: Page, name: string) {
  return page.getByRole("group", { name: `${name} group` }).filter({ visible: true });
}

function selectedMonth(page: Page) {
  return page.getByTestId("selected-month").filter({ visible: true });
}

function uniqueEmail(tag: string) {
  return `e2e-${tag}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

/** Current month in Asia/Colombo, computed independently of the app's helpers. */
function colomboMonth(offset = 0): { iso: string; label: string } {
  const now = new Date(Date.now() + (5 * 60 + 30) * 60_000); // UTC+05:30, no DST
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1));
  const iso = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  return { iso, label };
}

async function registerAndSignIn(page: Page, email: string) {
  await page.goto("/sign-up");
  await page.getByLabel("Name", { exact: true }).filter({ visible: true }).fill("E2E User");
  await field(page, "Email").fill(email);
  await field(page, "Password").fill(PASSWORD);
  await button(page, "Create account").click();
  await expect(page).toHaveURL(/\/sign-in\?notice=registered$/);
  await field(page, "Email").fill(email);
  await field(page, "Password").fill(PASSWORD);
  await button(page, "Sign in").click();
  await expect(page).toHaveURL(/\/onboarding$/);
}

async function csrf(request: APIRequestContext): Promise<string> {
  const response = await request.get(`${API}/api/v1/auth/csrf`);
  expect(response.ok()).toBe(true);
  return (await response.json()).token;
}

async function fillPlan(page: Page, values: [string, string, string, string, string, string]) {
  const labels = ["Planned income", "Savings target", "Needs budget", "Wants budget", "Culture budget", "Unexpected budget"];
  for (let i = 0; i < labels.length; i++) await field(page, labels[i]).fill(values[i]);
}

async function addExpense(page: Page, amount: string, category: string) {
  await page.goto("/transactions/new-expense");
  await field(page, "Amount *").fill(amount);
  const select = field(page, "Category *");
  await expect(select).toBeEnabled();
  await select.selectOption({ label: category });
  await button(page, "Save expense").click();
  await expect(page).toHaveURL(/\/transactions\?notice=expense-saved$/);
}

async function addIncome(page: Page, amount: string) {
  await page.goto("/transactions/new-income");
  await field(page, "Amount *").fill(amount);
  await expect(field(page, "Income Source (optional)")).toBeEnabled();
  await button(page, "Save income").click();
  await expect(page).toHaveURL(/\/transactions\?notice=income-saved$/);
}

async function savePlan(page: Page, month: string) {
  await page.goto(`/budget?month=${month}`);
  await expect(visibleText(page, /No budget for .* yet/)).toBeVisible();
  await fillPlan(page, ["100000", "15000", "40000", "20000", "10000", "5000"]);
  await button(page, "Create budget").click();
  await expect(visibleText(page, /^Budget for .* saved\.$/)).toBeVisible();
}

test("budget and dashboard routes require a session", async ({ page }) => {
  for (const path of ["/budget", "/dashboard"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/sign-in$/);
  }
});

test("full journey: plan a month, record activity, reconcile dashboard, change months", async ({ page }) => {
  const current = colomboMonth(0);
  const next = colomboMonth(1);
  const previous = colomboMonth(-1);
  await registerAndSignIn(page, uniqueEmail("budget"));

  // Open Budget from the navigation and select the month with the month controls.
  await page.goto("/transactions");
  await page.getByRole("link", { name: "Budget", exact: true }).filter({ visible: true }).click();
  await expect(page).toHaveURL(/\/budget$/);
  await expect(selectedMonth(page)).toHaveText(current.label);
  await button(page, `Next month, ${next.label}`).click();
  await expect(selectedMonth(page)).toHaveText(next.label);
  await expect(page).toHaveURL(new RegExp(`/budget\\?month=${next.iso}$`));
  await button(page, `Previous month, ${current.label}`).click();
  await expect(selectedMonth(page)).toHaveText(current.label);

  // Create the plan.
  await expect(visibleText(page, /No budget for .* yet/)).toBeVisible();
  await fillPlan(page, ["100000", "15000", "40000", "20000", "10000", "5000"]);
  const preview = page.getByRole("complementary").filter({ visible: true });
  await expect(preview.getByRole("heading", { name: "Preview — not saved yet" })).toBeVisible();
  await expect(preview.getByText("LKR 75,000.00")).toBeVisible();
  await expect(preview.getByText("LKR 90,000.00")).toBeVisible();
  await button(page, "Create budget").click();
  await expect(visibleText(page, `Budget for ${current.label} saved.`)).toBeVisible();

  // Reload: the saved plan is still there and shown as saved.
  await page.reload();
  await expect(field(page, "Planned income")).toHaveValue("100000.00");
  await expect(field(page, "Savings target")).toHaveValue("15000.00");
  await expect(field(page, "Needs budget")).toHaveValue("40000.00");
  await expect(field(page, "Wants budget")).toHaveValue("20000.00");
  await expect(field(page, "Culture budget")).toHaveValue("10000.00");
  await expect(field(page, "Unexpected budget")).toHaveValue("5000.00");
  await expect(page.getByRole("heading", { name: "Saved plan" }).filter({ visible: true })).toBeVisible();

  // Dashboard shows the saved plan and no activity yet.
  await page.goto(`/dashboard?month=${current.iso}`);
  await expect(group(page, "Needs")).toContainText("LKR 40,000.00");
  await expect(group(page, "Needs")).toContainText("Remaining LKR 40,000.00");
  await expect(visibleText(page, "No expenses recorded yet — record an expense")).toBeVisible();

  // Record expenses and income.
  await addExpense(page, "12500.25", "Groceries");
  await addExpense(page, "25000", "Entertainment");
  await addIncome(page, "60000");

  await page.goto(`/dashboard?month=${current.iso}`);
  const needs = group(page, "Needs");
  await expect(needs).toContainText("LKR 12,500.25");
  await expect(needs).toContainText("Remaining LKR 27,499.75");
  await expect(needs.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "31.3% of the Needs budget used");
  const wants = group(page, "Wants");
  await expect(wants).toContainText("LKR 25,000.00");
  await expect(wants).toContainText("Over budget");
  await expect(wants).toContainText("Over by LKR 5,000.00");
  await expect(wants.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "125.0% of the Wants budget used");
  await expect(group(page, "Culture")).toContainText("Remaining LKR 10,000.00");
  await expect(visibleText(page, "1 entry")).toBeVisible();
  await expect(page.getByRole("definition").filter({ hasText: "LKR 60,000.00" }).filter({ visible: true })).toBeVisible();
  await expect(page.getByRole("definition").filter({ hasText: "LKR 37,500.25" }).filter({ visible: true })).toBeVisible();

  // API values reconcile with the hand-calculated fixture and the UI above.
  const api = await (await page.request.get(`${API}/api/v1/dashboard?month=${current.iso}`)).json();
  expect(api).toMatchObject({
    month: current.iso,
    hasBudget: true,
    plannedIncome: "100000.00",
    savingsTarget: "15000.00",
    allocationTotal: "75000.00",
    plannedTotal: "90000.00",
    overAllocationAmount: "-10000.00",
    overAllocated: false,
    recordedIncome: "60000.00",
    totalSpent: "37500.25",
  });
  expect(api.groups).toEqual([
    { group: "NEEDS", budget: "40000.00", spent: "12500.25", remaining: "27499.75", percentUsed: "31.3", overBudget: false, expenseCount: 1 },
    { group: "WANTS", budget: "20000.00", spent: "25000.00", remaining: "-5000.00", percentUsed: "125.0", overBudget: true, expenseCount: 1 },
    { group: "CULTURE", budget: "10000.00", spent: "0.00", remaining: "10000.00", percentUsed: "0.0", overBudget: false, expenseCount: 0 },
    { group: "UNEXPECTED", budget: "5000.00", spent: "0.00", remaining: "5000.00", percentUsed: "0.0", overBudget: false, expenseCount: 0 },
  ]);

  // Previous month: empty, no fabricated figures.
  await button(page, `Previous month, ${previous.label}`).click();
  await expect(selectedMonth(page)).toHaveText(previous.label);
  await expect(page.getByRole("heading", { name: `No budget for ${previous.label}` }).filter({ visible: true })).toBeVisible();
  await expect(visibleText(page, /Nothing is planned or recorded for this month yet/)).toBeVisible();
  await expect(visibleText(page, /No transactions recorded in/)).toBeVisible();
  await expect(group(page, "Needs")).toContainText("Remaining: no budget set");

  // Back to the original month: everything persisted.
  await button(page, `Next month, ${current.label}`).click();
  await expect(group(page, "Needs")).toContainText("Remaining LKR 27,499.75");
  await expect(group(page, "Wants")).toContainText("Over by LKR 5,000.00");
});

test("an over-allocated plan saves with a clear warning", async ({ page }) => {
  const month = colomboMonth(2).iso;
  await registerAndSignIn(page, uniqueEmail("overalloc"));
  await page.goto(`/budget?month=${month}`);
  await expect(visibleText(page, /No budget for .* yet/)).toBeVisible();
  await fillPlan(page, ["80000", "15000", "40000", "20000", "10000", "5000"]);
  await expect(visibleText(page, /Plan exceeds planned income by/)).toContainText("LKR 10,000.00");
  await button(page, "Create budget").click();
  await expect(visibleText(page, /^Budget for .* saved\.$/)).toBeVisible();

  await page.goto(`/dashboard?month=${month}`);
  await expect(visibleText(page, /exceeds planned income by/)).toContainText(
    "exceeds planned income by LKR 10,000.00: savings target plus group budgets is LKR 90,000.00, planned income is LKR 80,000.00.",
  );
});

test("users cannot see each other's budgets or dashboard figures", async ({ browser }) => {
  const month = colomboMonth(0).iso;
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const a = await contextA.newPage();
  const b = await contextB.newPage();
  try {
    await registerAndSignIn(a, uniqueEmail("iso-a"));
    await savePlan(a, month);
    await addExpense(a, "4321.99", "Groceries");

    await registerAndSignIn(b, uniqueEmail("iso-b"));
    const budget = await b.request.get(`${API}/api/v1/budgets/${month}`);
    expect(budget.status()).toBe(404);
    expect((await budget.json()).code).toBe("BUDGET_NOT_FOUND");

    const dashboard = await (await b.request.get(`${API}/api/v1/dashboard?month=${month}`)).json();
    expect(dashboard.hasBudget).toBe(false);
    expect(dashboard.totalSpent).toBe("0.00");
    expect(JSON.stringify(dashboard)).not.toContain("4321.99");

    await b.goto(`/dashboard?month=${month}`);
    await expect(b.getByRole("heading", { name: /^No budget for / }).filter({ visible: true })).toBeVisible();
    await expect(visibleText(b, "LKR 4,321.99")).toHaveCount(0);
    await expect(visibleText(b, "LKR 100,000.00")).toHaveCount(0);

    // B's write creates B's plan only; A's stays unchanged.
    const write = await b.request.put(`${API}/api/v1/budgets/${month}`, {
      headers: { "X-XSRF-TOKEN": await csrf(b.request) },
      data: { plannedIncome: "1", savingsTarget: "0", allocations: { NEEDS: "0", WANTS: "0", CULTURE: "0", UNEXPECTED: "0" } },
    });
    expect(write.status()).toBe(200);
    expect((await (await a.request.get(`${API}/api/v1/budgets/${month}`)).json()).plannedIncome).toBe("100000.00");
  } finally {
    await contextA.close();
    await contextB.close();
  }
});

test("a failed budget save never shows success and keeps the entered values", async ({ page }) => {
  const month = colomboMonth(3).iso;
  await registerAndSignIn(page, uniqueEmail("budget-fail"));
  await page.route(`${API}/api/v1/budgets/${month}`, (route) =>
    route.request().method() === "PUT"
      ? route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ status: 500, code: "INTERNAL_ERROR", message: "Something went wrong on our side. Please try again." }),
        })
      : route.continue(),
  );
  await page.goto(`/budget?month=${month}`);
  await expect(visibleText(page, /No budget for .* yet/)).toBeVisible();
  await fillPlan(page, ["100000", "15000", "40000", "20000", "10000", "5000"]);
  await button(page, "Create budget").click();

  await expect(page.getByRole("alert").filter({ hasText: "Your plan was not saved" }).first()).toBeVisible();
  await expect(visibleText(page, /^Budget for .* saved\.$/)).toHaveCount(0);
  await expect(field(page, "Planned income")).toHaveValue("100000");
  await page.unroute(`${API}/api/v1/budgets/${month}`);
  expect((await page.request.get(`${API}/api/v1/budgets/${month}`)).status()).toBe(404);

  // Retry once the backend works again.
  await button(page, "Try again").click();
  await expect(visibleText(page, /^Budget for .* saved\.$/)).toBeVisible();
  expect((await page.request.get(`${API}/api/v1/budgets/${month}`)).status()).toBe(200);
});

test("budget writes without a CSRF token are rejected", async ({ page }) => {
  const month = colomboMonth(0).iso;
  await registerAndSignIn(page, uniqueEmail("budget-csrf"));
  const response = await page.request.put(`${API}/api/v1/budgets/${month}`, {
    data: { plannedIncome: "1", savingsTarget: "0", allocations: { NEEDS: "0", WANTS: "0", CULTURE: "0", UNEXPECTED: "0" } },
  });
  expect(response.status()).toBe(403);
  expect((await response.json()).code).toBe("CSRF_INVALID");
  expect((await page.request.get(`${API}/api/v1/budgets/${month}`)).status()).toBe(404);
});

test("an expired session on the budget page sends the user to sign in without saving", async ({ page }) => {
  const month = colomboMonth(0).iso;
  await registerAndSignIn(page, uniqueEmail("budget-expiry"));
  await page.goto(`/budget?month=${month}`);
  await expect(visibleText(page, /No budget for .* yet/)).toBeVisible();
  await fillPlan(page, ["1", "0", "0", "0", "0", "0"]);

  // End the session server-side, as an idle timeout would.
  const logout = await page.request.post(`${API}/api/v1/auth/logout`, { headers: { "X-XSRF-TOKEN": await csrf(page.request) } });
  expect(logout.status()).toBe(204);

  await button(page, "Create budget").click();
  await expect(page).toHaveURL(/\/sign-in\?notice=session-ended$/);
  await expect(visibleText(page, /^Budget for .* saved\.$/)).toHaveCount(0);
});
