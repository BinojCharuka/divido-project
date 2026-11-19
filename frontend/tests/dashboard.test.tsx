import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import type { Dashboard } from "@/types/budget";
import { apiError, installPhase03Backend, json } from "./phase03Backend";
import { renderWithShellStub } from "./shell";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
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
  return <DashboardPage month={month} onMonthChange={setMonth} />;
}

const summary = (label: string) =>
  screen.getAllByText(label).map((el) => el.closest(".summary-card")).find(Boolean) as HTMLElement;
const groupCard = (label: string) => screen.getByRole("progressbar", { name: `${label} plan used` }).closest("a") as HTMLElement;

let backend: ReturnType<typeof installPhase03Backend>;

beforeEach(() => {
  backend = installPhase03Backend();
  backend.on("GET", "/api/v1/auth/me", () => apiError(401, "UNAUTHENTICATED", "Please sign in to continue."));
  backend.on("GET", "/api/v1/transactions", NO_TRANSACTIONS);
});

describe("Dashboard (DASH-001)", () => {
  it("shows loading, then the server's figures with planned and recorded values apart", async () => {
    backend.on("GET", "/api/v1/dashboard", () => json(200, POPULATED));
    renderWithShellStub(<Harness />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading dashboard…");
    expect(await screen.findByText("Recorded income")).toBeInTheDocument();
    expect(summary("Planned income")).toHaveTextContent("LKR 80,000.00");
    expect(summary("Recorded income")).toHaveTextContent("LKR 85,000.00");
    expect(summary("Recorded income")).toHaveTextContent("2 records");
    expect(summary("Spent this month")).toHaveTextContent("LKR 47,500.50");
    expect(summary("Savings target")).toHaveTextContent("LKR 15,000.00");
    expect(backend.calls.find((c) => c.path === "/api/v1/dashboard")?.search).toBe("?month=2026-10");
  });

  it("shows overspent groups as over plan, and no percentage for a zero plan", async () => {
    backend.on("GET", "/api/v1/dashboard", () => json(200, POPULATED));
    renderWithShellStub(<Harness />);
    await screen.findByText("Recorded income");
    expect(groupCard("Needs")).toHaveTextContent("LKR 1,250.50 over plan");
    expect(groupCard("Needs")).toHaveTextContent("103.1%");
    expect(groupCard("Wants")).toHaveTextContent("LKR 30,000.00 left");
    expect(within(groupCard("Culture")).getByRole("progressbar")).toHaveAttribute("aria-valuetext", "Nothing planned");
  });

  it("warns about a plan above income and shows available balance", async () => {
    backend.on("GET", "/api/v1/dashboard", () => json(200, POPULATED));
    renderWithShellStub(<Harness />);
    await screen.findByText("Recorded income");
    const plan = screen.getByRole("region", { name: "Spent against group plans" });
    expect(within(plan).getByText("Planned above income").nextElementSibling).toHaveTextContent("LKR 10,000.00");
    expect(within(plan).getByText(/above planned income/)).toBeInTheDocument();
    expect(screen.getByText("AVAILABLE BALANCE")).toBeInTheDocument();
  });

  it("renders an empty month without inventing figures", async () => {
    backend.on("GET", "/api/v1/dashboard", () => json(200, empty("2026-10")));
    renderWithShellStub(<Harness />);
    expect(await screen.findByText("Nothing planned or recorded for October 2026")).toBeInTheDocument();
    expect(summary("Planned income")).toHaveTextContent("Not planned");
    expect(summary("Savings target")).toHaveTextContent("Not planned");
    expect(summary("Spent this month")).toHaveTextContent("LKR 0.00");
    expect(screen.getByText("No plan for this month yet. Planned figures appear here once you save one.")).toBeInTheDocument();
    expect(screen.getByText("No transactions in October 2026")).toBeInTheDocument();
  });

  it("shows recorded actuals when there is no plan", async () => {
    backend.on("GET", "/api/v1/dashboard", () =>
      json(200, { ...empty("2026-10"), recordedIncome: "5000.00", incomeTransactionCount: 1, totalSpent: "1200.00", expenseTransactionCount: 1 }),
    );
    renderWithShellStub(<Harness />);
    await screen.findByText("Recorded income");
    expect(screen.queryByText(/Nothing planned or recorded/)).not.toBeInTheDocument();
    expect(summary("Recorded income")).toHaveTextContent("LKR 5,000.00");
    expect(summary("Planned income")).toHaveTextContent("Not planned");
  });

  it("opens the add dialogs through the app shell", async () => {
    const user = userEvent.setup();
    backend.on("GET", "/api/v1/dashboard", () => json(200, POPULATED));
    const { actions } = renderWithShellStub(<Harness />);
    await screen.findByText("Recorded income");
    await user.click(screen.getByRole("button", { name: "Add expense" }));
    expect(actions.openAdd).toHaveBeenCalledWith("EXPENSE");
  });

  it("shows an error with retry and no figures when the API fails", async () => {
    const user = userEvent.setup();
    backend.once("GET", "/api/v1/dashboard", () => apiError(500, "INTERNAL_ERROR", "boom"));
    backend.on("GET", "/api/v1/dashboard", () => json(200, POPULATED));
    renderWithShellStub(<Harness />);
    expect(await screen.findByText(/couldn't load your dashboard/)).toBeInTheDocument();
    expect(screen.queryByText("LKR 80,000.00")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Recorded income")).toBeInTheDocument();
  });

  it("loads the chosen month when stepping across the year boundary", async () => {
    const user = userEvent.setup();
    backend.on("GET", "/api/v1/dashboard", ({ search }) => json(200, empty(search.get("month")!)));
    renderWithShellStub(<Harness initial="2026-12" />);
    await screen.findByText("Nothing planned or recorded for December 2026");
    await user.click(screen.getByRole("button", { name: "Next month" }));
    expect(await screen.findByText("Nothing planned or recorded for January 2027")).toBeInTheDocument();
  });
});
