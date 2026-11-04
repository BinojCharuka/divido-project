import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardView } from "@/features/dashboard/DashboardView";
import type { Dashboard } from "@/types/budget";
import { apiError, installPhase03Backend, json } from "./phase03Backend";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));

/** Fixture B from the backend reconciliation test: over-allocated plan, overspent NEEDS, zero CULTURE budget. */
const POPULATED: Dashboard = {
  month: "2026-10",
  periodStart: "2026-10-01",
  periodEnd: "2026-10-31",
  hasBudget: true,
  plannedIncome: "80000.00",
  savingsTarget: "15000.00",
  allocationTotal: "75000.00",
  plannedTotal: "90000.00",
  overAllocationAmount: "10000.00",
  overAllocated: true,
  recordedIncome: "85000.00",
  incomeTransactionCount: 2,
  totalSpent: "47500.50",
  expenseTransactionCount: 3,
  groups: [
    { group: "NEEDS", budget: "40000.00", spent: "41250.50", remaining: "-1250.50", percentUsed: "103.1", overBudget: true, expenseCount: 2 },
    { group: "WANTS", budget: "30000.00", spent: "0.00", remaining: "30000.00", percentUsed: "0.0", overBudget: false, expenseCount: 0 },
    { group: "CULTURE", budget: "0.00", spent: "0.00", remaining: "0.00", percentUsed: null, overBudget: false, expenseCount: 0 },
    { group: "UNEXPECTED", budget: "5000.00", spent: "6250.00", remaining: "-1250.00", percentUsed: "125.0", overBudget: true, expenseCount: 1 },
  ],
};

function empty(month: string): Dashboard {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return {
    month,
    periodStart: `${month}-01`,
    periodEnd: `${month}-${last}`,
    hasBudget: false,
    plannedIncome: null,
    savingsTarget: null,
    allocationTotal: null,
    plannedTotal: null,
    overAllocationAmount: null,
    overAllocated: null,
    recordedIncome: "0.00",
    incomeTransactionCount: 0,
    totalSpent: "0.00",
    expenseTransactionCount: 0,
    groups: (["NEEDS", "WANTS", "CULTURE", "UNEXPECTED"] as const).map((group) => ({
      group,
      budget: null,
      spent: "0.00",
      remaining: null,
      percentUsed: null,
      overBudget: null,
      expenseCount: 0,
    })),
  };
}

const NO_TRANSACTIONS = () => json(200, { items: [], page: 0, size: 5, totalItems: 0, totalPages: 0 });

function Harness({ initial = "2026-10" }: { initial?: string }) {
  const [month, setMonth] = useState(initial);
  return <DashboardView month={month} onMonthChange={setMonth} />;
}

function groupCard(name: string) {
  return screen.getByLabelText(`${name} group`);
}

describe("DashboardView", () => {
  let backend: ReturnType<typeof installPhase03Backend>;

  beforeEach(() => {
    backend = installPhase03Backend();
    backend.on("GET", "/api/v1/transactions", NO_TRANSACTIONS);
  });

  it("shows a loading state, then server-provided figures", async () => {
    backend.on("GET", "/api/v1/dashboard", () => json(200, POPULATED));
    render(<Harness />);
    expect(screen.getAllByRole("status")[0]).toHaveTextContent("Loading dashboard for October 2026");
    expect(await screen.findByText("LKR 85,000.00")).toBeInTheDocument();
    expect(backend.calls.find((c) => c.path === "/api/v1/dashboard")?.search).toBe("?month=2026-10");
  });

  it("separates planned values from recorded values", async () => {
    backend.on("GET", "/api/v1/dashboard", () => json(200, POPULATED));
    render(<Harness />);
    await screen.findByText("Your plan");
    const plannedCard = screen.getByText("Your plan").closest("div.rounded-xl") as HTMLElement;
    const recordedCard = screen.getByText("What happened").closest("div.rounded-xl") as HTMLElement;
    expect(within(plannedCard).getByText("Planned")).toBeInTheDocument();
    expect(within(plannedCard).getByText("Planned income").nextSibling).toHaveTextContent("LKR 80,000.00");
    expect(within(plannedCard).getByText("Savings target").nextSibling).toHaveTextContent("LKR 15,000.00");
    expect(within(plannedCard).getByText("Group budgets total").nextSibling).toHaveTextContent("LKR 75,000.00");
    expect(within(recordedCard).getByText("Recorded")).toBeInTheDocument();
    expect(within(recordedCard).getByText("Recorded income").nextSibling).toHaveTextContent("LKR 85,000.00");
    expect(within(recordedCard).getByText("Spent").nextSibling).toHaveTextContent("LKR 47,500.50");
  });

  it("renders four group summaries with negative remaining amounts shown as overspending", async () => {
    backend.on("GET", "/api/v1/dashboard", () => json(200, POPULATED));
    render(<Harness />);
    await screen.findByText("Kakeibo groups: budget vs spent");
    expect(screen.getAllByRole("listitem")).toHaveLength(4);

    const needs = groupCard("Needs");
    expect(within(needs).getByText("Over budget")).toBeInTheDocument();
    expect(within(needs).getByText(/Over by/)).toHaveTextContent("Over by LKR 1,250.50");
    const bar = within(needs).getByRole("progressbar", { name: "Needs budget used" });
    expect(bar).toHaveAttribute("aria-valuenow", "100");
    expect(bar).toHaveAttribute("aria-valuetext", "103.1% of the Needs budget used");

    const wants = groupCard("Wants");
    expect(within(wants).getByText(/Remaining/)).toHaveTextContent("Remaining LKR 30,000.00");
    expect(within(wants).getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");

    const unexpected = groupCard("Unexpected");
    expect(within(unexpected).getByText(/Over by/)).toHaveTextContent("LKR 1,250.00");
  });

  it("shows no percentage for a zero allocation", async () => {
    backend.on("GET", "/api/v1/dashboard", () => json(200, POPULATED));
    render(<Harness />);
    await screen.findByText("Kakeibo groups: budget vs spent");
    const culture = groupCard("Culture");
    expect(within(culture).queryByRole("progressbar")).not.toBeInTheDocument();
    expect(within(culture).getByText(/no percentage is shown/)).toBeInTheDocument();
  });

  it("shows the over-allocation warning with its breakdown", async () => {
    backend.on("GET", "/api/v1/dashboard", () => json(200, POPULATED));
    render(<Harness />);
    const warning = await screen.findByText(/exceeds planned income by/);
    expect(warning).toHaveTextContent(
      "Your plan for October 2026 exceeds planned income by LKR 10,000.00: savings target plus group budgets is LKR 90,000.00, planned income is LKR 80,000.00.",
    );
    expect(within(warning).getByRole("link", { name: "Adjust budget" })).toHaveAttribute("href", "/budget?month=2026-10");
  });

  it("renders a completely empty month without fabricated figures", async () => {
    backend.on("GET", "/api/v1/dashboard", () => json(200, empty("2026-10")));
    render(<Harness />);
    expect(await screen.findByRole("heading", { name: "No budget for October 2026" })).toBeInTheDocument();
    expect(screen.getByText(/Nothing is planned or recorded for this month yet/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create budget" })).toHaveAttribute("href", "/budget?month=2026-10");
    expect(screen.getAllByText("Not set").length).toBeGreaterThanOrEqual(3 + 4);
    expect(screen.queryAllByRole("progressbar")).toHaveLength(0);
    expect(screen.getByRole("link", { name: /No income recorded yet/ })).toHaveAttribute("href", "/transactions/new-income");
    expect(screen.getByRole("link", { name: /No expenses recorded yet/ })).toHaveAttribute("href", "/transactions/new-expense");
    expect(await screen.findByText(/No transactions recorded in October 2026/)).toBeInTheDocument();
    expect(screen.queryByText(/Over budget/)).not.toBeInTheDocument();
  });

  it("shows recorded actuals when there are transactions but no budget", async () => {
    backend.on("GET", "/api/v1/dashboard", () =>
      json(200, {
        ...empty("2026-10"),
        recordedIncome: "50000.00",
        incomeTransactionCount: 1,
        totalSpent: "1200.00",
        expenseTransactionCount: 1,
        groups: empty("2026-10").groups.map((g) => (g.group === "NEEDS" ? { ...g, spent: "1200.00", expenseCount: 1 } : g)),
      }),
    );
    render(<Harness />);
    expect(await screen.findByText(/Your recorded transactions are shown below/)).toBeInTheDocument();
    expect(within(groupCard("Needs")).getByText("LKR 1,200.00")).toBeInTheDocument();
    expect(within(groupCard("Needs")).getByText("Remaining: no budget set")).toBeInTheDocument();
    expect(screen.getByText("1 entry")).toBeInTheDocument();
  });

  it("shows a budget with no transactions", async () => {
    backend.on("GET", "/api/v1/dashboard", () =>
      json(200, {
        ...POPULATED,
        overAllocated: false,
        overAllocationAmount: "-10000.00",
        recordedIncome: "0.00",
        incomeTransactionCount: 0,
        totalSpent: "0.00",
        expenseTransactionCount: 0,
        groups: POPULATED.groups.map((g) => ({
          ...g,
          spent: "0.00",
          remaining: g.budget,
          percentUsed: g.budget === "0.00" ? null : "0.0",
          overBudget: false,
          expenseCount: 0,
        })),
      }),
    );
    render(<Harness />);
    expect(await screen.findByRole("link", { name: /No expenses recorded yet/ })).toBeInTheDocument();
    expect(screen.queryByText(/No budget for/)).not.toBeInTheDocument();
    expect(screen.queryByText(/exceeds planned income/)).not.toBeInTheDocument();
    expect(within(groupCard("Needs")).getByText(/Remaining/)).toHaveTextContent("LKR 40,000.00");
  });

  it("shows an error with retry and no figures when the API fails", async () => {
    const user = userEvent.setup();
    backend.once("GET", "/api/v1/dashboard", () => apiError(500, "INTERNAL_ERROR", "x"));
    backend.on("GET", "/api/v1/dashboard", () => json(200, POPULATED));
    render(<Harness />);
    expect(await screen.findByText("We couldn't load your dashboard. Please try again.")).toBeInTheDocument();
    expect(screen.queryByText(/LKR/)).not.toBeInTheDocument();
    await user.click(screen.getAllByRole("button", { name: "Try again" })[0]);
    expect(await screen.findByText("LKR 85,000.00")).toBeInTheDocument();
  });

  it("loads the selected month when navigating, including across years", async () => {
    const user = userEvent.setup();
    backend.on("GET", "/api/v1/dashboard", ({ search }) => {
      const month = search.get("month")!;
      return json(200, month === "2026-12" ? { ...POPULATED, month } : empty(month));
    });
    render(<Harness initial="2026-12" />);
    expect(await screen.findByText("LKR 85,000.00")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Next month, January 2027" }));
    expect(await screen.findByRole("heading", { name: "No budget for January 2027" })).toBeInTheDocument();
    const recent = backend.calls.filter((c) => c.path === "/api/v1/transactions").at(-1)!;
    expect(recent.search).toContain("from=2027-01-01");
    expect(recent.search).toContain("to=2027-01-31");
    await user.click(screen.getByRole("button", { name: "Previous month, December 2026" }));
    expect(await screen.findByText("LKR 85,000.00")).toBeInTheDocument();
    expect(backend.calls.filter((c) => c.path === "/api/v1/dashboard").map((c) => c.search)).toEqual([
      "?month=2026-12",
      "?month=2027-01",
      "?month=2026-12",
    ]);
  });
});
