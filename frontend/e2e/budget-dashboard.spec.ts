import { expect, test, type Page } from "@playwright/test";
import {
  addExpense,
  addIncome,
  alertWith,
  API,
  button,
  colomboMonth,
  csrf,
  expectBackend,
  field,
  registerAndSignIn,
  toast,
  uniqueEmail,
  visibleText,
} from "./helpers";

/**
 * Phase 03 journeys (DIV-025, DIV-026) in a real browser against the real backend and
 * a disposable database. Synthetic data only. Expected figures are worked out by hand
 * below, never by calling the production calculation code.
 *
 * Plan: income 100,000.00, savings 15,000.00, NEEDS 40,000.00, WANTS 20,000.00,
 *       CULTURE 10,000.00, UNEXPECTED 5,000.00 -> groups 75,000.00, planned 90,000.00,
 *       10,000.00 left unplanned.
 * Expenses: Groceries 12,500.25 (NEEDS) -> 27,499.75 left, 31.3% used
 *           Entertainment 25,000.00 (WANTS) -> 5,000.00 over plan, 125.0% used
 * Income: 60,000.00. Total spent 37,500.25.
 */
test.beforeAll(async ({ request }) => expectBackend(request));

const PLAN_LABELS = [
  "Planned income",
  "Monthly savings target",
  "Needs planned amount",
  "Wants planned amount",
  "Culture planned amount",
  "Unexpected planned amount",
];

function selectedMonth(page: Page) {
  return field(page, "Select month");
}

/** A dashboard group card, found through its progress bar's label. */
function group(page: Page, name: string) {
  return page.locator("a.budget-card").filter({ has: page.getByRole("progressbar", { name: `${name} plan used` }) });
}

function summary(page: Page, label: string) {
  return page.locator(".summary-card").filter({ hasText: label });
}

async function fillPlan(page: Page, values: string[]) {
  for (let i = 0; i < PLAN_LABELS.length; i++) await field(page, PLAN_LABELS[i]).fill(values[i]);
}

async function savePlan(page: Page, month: { iso: string; label: string }, values = ["100000", "15000", "40000", "20000", "10000", "5000"]) {
  await page.goto(`/budget?month=${month.iso}`);
  await expect(visibleText(page, `No plan saved for ${month.label} yet`)).toBeVisible();
  await fillPlan(page, values);
  await button(page, "Save plan").click();
  await expect(toast(page)).toHaveText(`Plan for ${month.label} saved`);
}

test("full journey: plan a month, record activity, reconcile dashboard, change months", async ({ page }) => {
  const current = colomboMonth(0);
  const next = colomboMonth(1);
  const previous = colomboMonth(-1);
  await registerAndSignIn(page, uniqueEmail("budget"));

  // Open Budget from the navigation and move between months with the month controls.
  await page.locator(".sidebar").getByRole("link", { name: "Budget", exact: true }).click();
  await expect(page).toHaveURL(/\/budget$/);
  await expect(selectedMonth(page)).toHaveValue(current.iso);
  await button(page, "Next month").click();
  await expect(selectedMonth(page)).toHaveValue(next.iso);
  await expect(page).toHaveURL(new RegExp(`/budget\\?month=${next.iso}$`));
  await button(page, "Previous month").click();
  await expect(selectedMonth(page)).toHaveValue(current.iso);

  // Create the plan; the preview is exact before saving.
  await expect(visibleText(page, `No plan saved for ${current.label} yet`)).toBeVisible();
  await fillPlan(page, ["100000", "15000", "40000", "20000", "10000", "5000"]);
  await expect(visibleText(page, "Not saved yet")).toBeVisible();
  await expect(page.locator(".budget-unallocated")).toContainText("Left unplanned");
  await expect(page.locator(".budget-unallocated")).toContainText("LKR 10,000.00");
  await expect(page.locator(".budget-save-bar")).toContainText("LKR 90,000.00");
  await button(page, "Save plan").click();
  await expect(toast(page)).toHaveText(`Plan for ${current.label} saved`);

  // Reload: the saved plan is still there and shown as saved.
  await page.reload();
  const saved = ["100000.00", "15000.00", "40000.00", "20000.00", "10000.00", "5000.00"];
  for (let i = 0; i < PLAN_LABELS.length; i++) await expect(field(page, PLAN_LABELS[i])).toHaveValue(saved[i]);
  await expect(visibleText(page, "Saved plan")).toBeVisible();

  // Dashboard shows the saved plan and no activity yet.
  await page.goto(`/dashboard?month=${current.iso}`);
  await expect(group(page, "Needs")).toContainText("of LKR 40,000.00 planned");
  await expect(group(page, "Needs")).toContainText("LKR 40,000.00 left");
  await expect(visibleText(page, `No transactions in ${current.label}`)).toBeVisible();

  // Record expenses and income.
  await addExpense(page, "12500.25", "Groceries");
  await addExpense(page, "25000", "Entertainment");
  await addIncome(page, "60000");

  await page.goto(`/dashboard?month=${current.iso}`);
  const needs = group(page, "Needs");
  await expect(needs).toContainText("LKR 12,500.25 spent");
  await expect(needs).toContainText("LKR 27,499.75 left");
  await expect(needs.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "31.3% used");
  const wants = group(page, "Wants");
  await expect(wants).toContainText("LKR 25,000.00 spent");
  await expect(wants).toContainText("LKR 5,000.00 over plan");
  await expect(wants.getByRole("progressbar")).toHaveAttribute("aria-valuetext", "125.0% used");
  await expect(group(page, "Culture")).toContainText("LKR 10,000.00 left");
  await expect(summary(page, "Recorded income")).toContainText("60,000.00");
  await expect(summary(page, "Spent this month")).toContainText("37,500.25");
  await expect(summary(page, "Spent this month")).toContainText("2 expenses");
  // No "available money" figure anywhere (BR-008).
  await expect(page.locator("main")).not.toContainText(/available/i);

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

  // Previous month: empty, no invented figures.
  await button(page, "Previous month").click();
  await expect(selectedMonth(page)).toHaveValue(previous.iso);
  await expect(visibleText(page, `Nothing planned or recorded for ${previous.label}`)).toBeVisible();
  await expect(summary(page, "Planned income")).toContainText("Not planned");
  await expect(group(page, "Needs")).toContainText("No plan for this month");

  // Back to the original month: everything persisted.
  await button(page, "Next month").click();
  await expect(group(page, "Needs")).toContainText("LKR 27,499.75 left");
  await expect(group(page, "Wants")).toContainText("LKR 5,000.00 over plan");
});

test("a plan above planned income saves with a clear warning (DEC-012)", async ({ page }) => {
  const month = colomboMonth(2);
  await registerAndSignIn(page, uniqueEmail("overalloc"));
  await page.goto(`/budget?month=${month.iso}`);
  await expect(visibleText(page, `No plan saved for ${month.label} yet`)).toBeVisible();
  await fillPlan(page, ["80000", "15000", "40000", "20000", "10000", "5000"]);
  await expect(visibleText(page, /LKR 10,000\.00 above your planned income/)).toBeVisible();
  await button(page, "Save plan").click();
  await expect(toast(page)).toHaveText(`Plan for ${month.label} saved`);

  await page.goto(`/dashboard?month=${month.iso}`);
  const plan = page.getByRole("region", { name: "Spent against group plans" });
  await expect(plan).toContainText("Planned above income");
  await expect(plan).toContainText("LKR 10,000.00");
  await expect(plan).toContainText("Savings and allocations are above planned income.");
});

test("users cannot see each other's budgets or dashboard figures", async ({ browser }) => {
  const month = colomboMonth(0);
  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const a = await contextA.newPage();
  const b = await contextB.newPage();
  try {
    await registerAndSignIn(a, uniqueEmail("iso-a"));
    await savePlan(a, month);
    await addExpense(a, "4321.99", "Groceries");

    await registerAndSignIn(b, uniqueEmail("iso-b"));
    const budget = await b.request.get(`${API}/api/v1/budgets/${month.iso}`);
    expect(budget.status()).toBe(404);
    expect((await budget.json()).code).toBe("BUDGET_NOT_FOUND");

    const dashboard = await (await b.request.get(`${API}/api/v1/dashboard?month=${month.iso}`)).json();
    expect(dashboard.hasBudget).toBe(false);
    expect(dashboard.totalSpent).toBe("0.00");
    expect(JSON.stringify(dashboard)).not.toContain("4321.99");

    await b.goto(`/dashboard?month=${month.iso}`);
    await expect(visibleText(b, `Nothing planned or recorded for ${month.label}`)).toBeVisible();
    await expect(b.locator("main")).not.toContainText("4,321.99");
    await expect(b.locator("main")).not.toContainText("100,000.00");

    // B's write creates B's plan only; A's stays unchanged.
    const write = await b.request.put(`${API}/api/v1/budgets/${month.iso}`, {
      headers: { "X-XSRF-TOKEN": await csrf(b.request) },
      data: { plannedIncome: "1", savingsTarget: "0", allocations: { NEEDS: "0", WANTS: "0", CULTURE: "0", UNEXPECTED: "0" } },
    });
    expect(write.status()).toBe(200);
    expect((await (await a.request.get(`${API}/api/v1/budgets/${month.iso}`)).json()).plannedIncome).toBe("100000.00");
  } finally {
    await contextA.close();
    await contextB.close();
  }
});

test("a failed budget save never shows success and keeps the entered values", async ({ page }) => {
  const month = colomboMonth(3);
  await registerAndSignIn(page, uniqueEmail("budget-fail"));
  await page.route(`${API}/api/v1/budgets/${month.iso}`, (route) =>
    route.request().method() === "PUT"
      ? route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ status: 500, code: "INTERNAL_ERROR", message: "Something went wrong on our side. Please try again." }),
        })
      : route.continue(),
  );
  await page.goto(`/budget?month=${month.iso}`);
  await expect(visibleText(page, `No plan saved for ${month.label} yet`)).toBeVisible();
  await fillPlan(page, ["100000", "15000", "40000", "20000", "10000", "5000"]);
  await button(page, "Save plan").click();

  await expect(alertWith(page, "Your plan was not saved")).toBeVisible();
  await expect(toast(page)).toHaveCount(0);
  await expect(field(page, "Planned income")).toHaveValue("100000");
  await page.unroute(`${API}/api/v1/budgets/${month.iso}`);
  expect((await page.request.get(`${API}/api/v1/budgets/${month.iso}`)).status()).toBe(404);

  // Saving again once the backend works stores the plan.
  await button(page, "Save plan").click();
  await expect(toast(page)).toHaveText(`Plan for ${month.label} saved`);
  expect((await page.request.get(`${API}/api/v1/budgets/${month.iso}`)).status()).toBe(200);
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
  const month = colomboMonth(0);
  await registerAndSignIn(page, uniqueEmail("budget-expiry"));
  await page.goto(`/budget?month=${month.iso}`);
  await expect(visibleText(page, `No plan saved for ${month.label} yet`)).toBeVisible();
  await fillPlan(page, ["1", "0", "0", "0", "0", "0"]);

  // End the session server-side, as an idle timeout would.
  const logout = await page.request.post(`${API}/api/v1/auth/logout`, { headers: { "X-XSRF-TOKEN": await csrf(page.request) } });
  expect(logout.status()).toBe(204);

  await button(page, "Save plan").click();
  await expect(page).toHaveURL(/\/sign-in\?notice=session-ended$/);
  await expect(toast(page)).toHaveCount(0);
});
