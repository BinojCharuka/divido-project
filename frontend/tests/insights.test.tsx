import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InsightsPage } from "@/features/insights/InsightsPage";
import type { Insights } from "@/types/insights";
import { apiError, installPhase03Backend, json } from "./phase03Backend";
import { renderWithShellStub } from "./shell";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/insights",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const groups = (spent: [string, string, string, string], shares: [string | null, string | null, string | null, string | null]) =>
  (["NEEDS", "WANTS", "CULTURE", "UNEXPECTED"] as const).map((group, i) => ({
    group,
    spent: spent[i],
    sharePercent: shares[i],
    expenseCount: Number(spent[i]) > 0 ? 1 : 0,
  }));

/** Mirrors the backend fixtures in InsightsIntegrationTest. */
const POPULATED: Insights = {
  month: "2026-10",
  periodStart: "2026-10-01",
  periodEnd: "2026-10-31",
  asOf: "2026-10-31",
  partialMonth: false,
  minimumSpendingDays: 3,
  spendingDays: 3,
  insufficientHistory: false,
  totalSpent: "2000.00",
  groups: groups(["1700.00", "300.00", "0.00", "0.00"], ["85.0", "15.0", "0.0", "0.0"]),
  comparison: {
    currentStart: "2026-10-01",
    currentEnd: "2026-10-31",
    previousStart: "2026-09-01",
    previousEnd: "2026-09-30",
    currentSpent: "2000.00",
    previousSpent: "1600.00",
    changePercent: "25.0",
    currentSpendingDays: 3,
    previousSpendingDays: 4,
    groups: [],
  },
  trend: [
    { month: "2026-05", totalSpent: null, hasActivity: false, partial: false },
    { month: "2026-06", totalSpent: null, hasActivity: false, partial: false },
    { month: "2026-07", totalSpent: "0.00", hasActivity: true, partial: false },
    { month: "2026-08", totalSpent: "900.00", hasActivity: true, partial: false },
    { month: "2026-09", totalSpent: "1600.00", hasActivity: true, partial: false },
    { month: "2026-10", totalSpent: "2000.00", hasActivity: true, partial: false },
  ],
  lookbackStart: "2026-08-03",
  lookbackEnd: "2026-10-31",
  observations: [
    { type: "LARGEST_GROUP", group: "NEEDS", spent: "1700.00", sharePercent: "85.0", spendingDays: 3 },
    { type: "GROUP_OVER_PLAN", group: "NEEDS", budget: "1000.00", spent: "1700.00", overBy: "700.00" },
    { type: "MONTH_CHANGE", currentSpent: "2000.00", previousSpent: "1600.00", changePercent: "25.0" },
    {
      type: "REPEATED_CATEGORY",
      categoryId: "c1",
      categoryName: "Groceries",
      group: "NEEDS",
      distinctDays: 3,
      transactionCount: 4,
      dates: ["2026-08-19", "2026-09-10", "2026-10-30"],
    },
  ],
};

const EMPTY: Insights = {
  ...POPULATED,
  spendingDays: 1,
  insufficientHistory: true,
  totalSpent: "10.00",
  groups: groups(["10.00", "0.00", "0.00", "0.00"], ["100.0", "0.0", "0.0", "0.0"]),
  observations: [],
};

function Harness({ initial = "2026-10" }: { initial?: string }) {
  const [month, setMonth] = useState(initial);
  return <InsightsPage month={month} onMonthChange={setMonth} />;
}

const card = (title: string) => screen.getByRole("heading", { name: title }).closest("a") as HTMLElement;

let backend: ReturnType<typeof installPhase03Backend>;

beforeEach(() => {
  backend = installPhase03Backend();
  backend.on("GET", "/api/v1/auth/me", () => apiError(401, "UNAUTHENTICATED", "Please sign in to continue."));
});

describe("Spending insights (INSIGHT-001)", () => {
  it("shows each backend observation with factual wording and its period", async () => {
    backend.on("GET", "/api/v1/insights", () => json(200, POPULATED));
    renderWithShellStub(<Harness />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading insights…");

    expect(await screen.findByRole("heading", { name: "Needs was your largest group" })).toBeInTheDocument();
    expect(card("Needs was your largest group")).toHaveTextContent("LKR 1,700.00 in Needs, 85.0% of your spending in October 2026");
    expect(card("Needs was your largest group")).toHaveTextContent("spending on 3 days");
    expect(card("Needs is above its plan")).toHaveTextContent("against a plan of LKR 1,000.00, which is LKR 700.00 more than planned");
    expect(card("Needs is above its plan")).toHaveAttribute("href", "/budget?month=2026-10");
    expect(card("Compared with September 2026")).toHaveTextContent("25.0% more than the LKR 1,600.00 you recorded in September 2026");
    expect(card("Groceries on 3 days")).toHaveTextContent("Groceries 4 times on 3 days");
    expect(card("Groceries on 3 days")).toHaveTextContent("Last 90 days · Aug 3 – Oct 31, 2026");
    expect(backend.calls.find((c) => c.path === "/api/v1/insights")?.search).toBe("?month=2026-10");
  });

  it("never uses habit, advice or blame wording (BR-026, BR-027)", async () => {
    backend.on("GET", "/api/v1/insights", () => json(200, POPULATED));
    renderWithShellStub(<Harness />);
    await screen.findByRole("heading", { name: "Observations" });
    const text = document.body.textContent ?? "";
    for (const word of [/habit/i, /regular/i, /should/i, /overspend/i, /bad/i, /Kakeibo/]) expect(text).not.toMatch(word);
  });

  it("explains insufficient history instead of presenting a pattern (AC-019)", async () => {
    backend.on("GET", "/api/v1/insights", () => json(200, EMPTY));
    const user = userEvent.setup();
    const { actions } = renderWithShellStub(<Harness />);
    expect(await screen.findByRole("heading", { name: "Not enough history for October 2026 yet" })).toBeInTheDocument();
    expect(screen.getByText("1 of 3 spending days")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Observations" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Add expense" }));
    expect(actions.openAdd).toHaveBeenCalledWith("EXPENSE");
  });

  it("charts the trend with no point before the first record, and group shares from the API", async () => {
    backend.on("GET", "/api/v1/insights", () => json(200, POPULATED));
    renderWithShellStub(<Harness />);
    const chart = await screen.findByRole("img", { name: /Recorded spending by month/ });
    expect(chart).toHaveAccessibleName(expect.stringContaining("May 2026: no activity"));
    expect(chart).toHaveAccessibleName(expect.stringContaining("July 2026: LKR 0.00"));
    expect(chart.querySelectorAll(".trend-dot")).toHaveLength(4);
    const share = screen.getByRole("region", { name: "Where your money went" });
    expect(within(share).getByRole("img")).toHaveAccessibleName("Total spent LKR 2,000.00. Needs 85.0%, Wants 15.0%, Culture 0.0%, Unexpected 0.0%.");
    expect(within(share).getByText(/current group/)).toBeInTheDocument();
  });

  it("does not request a month that has not started", async () => {
    backend.on("GET", "/api/v1/insights", () => json(200, POPULATED));
    renderWithShellStub(<Harness initial="2099-01" />);
    expect(await screen.findByRole("heading", { name: "January 2099 hasn’t started yet" })).toBeInTheDocument();
    expect(backend.calls.some((c) => c.path === "/api/v1/insights")).toBe(false);
  });

  it("shows an error with retry and no figures when the API fails", async () => {
    const user = userEvent.setup();
    backend.once("GET", "/api/v1/insights", () => apiError(500, "INTERNAL_ERROR", "boom"));
    backend.on("GET", "/api/v1/insights", () => json(200, POPULATED));
    renderWithShellStub(<Harness />);
    expect(await screen.findByText(/couldn't load your insights/)).toBeInTheDocument();
    expect(screen.queryByText(/LKR 1,700.00/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("heading", { name: "Needs was your largest group" })).toBeInTheDocument();
  });
});
