import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BudgetPlanner } from "@/features/budget/BudgetPlanner";
import type { MonthlyBudget } from "@/types/budget";
import { apiError, installPhase03Backend, json } from "./phase03Backend";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/budget",
  useSearchParams: () => new URLSearchParams(),
}));

const SAVED: MonthlyBudget = {
  month: "2026-10",
  plannedIncome: "100000.00",
  savingsTarget: "15000.00",
  allocations: { NEEDS: "40000.00", WANTS: "20000.00", CULTURE: "10000.00", UNEXPECTED: "5000.00" },
  allocationTotal: "75000.00",
  plannedTotal: "90000.00",
  overAllocationAmount: "-10000.00",
  overAllocated: false,
  createdAt: "2026-10-01T00:00:00Z",
  updatedAt: "2026-10-01T00:00:00Z",
};

function Harness({ initial = "2026-10" }: { initial?: string }) {
  const [month, setMonth] = useState(initial);
  return <BudgetPlanner month={month} onMonthChange={setMonth} />;
}

const notFound = () => apiError(404, "BUDGET_NOT_FOUND", "No budget has been set for this month.");

async function fillPlan(user: ReturnType<typeof userEvent.setup>, values: string[]) {
  const labels = ["Planned income", "Savings target", "Needs budget", "Wants budget", "Culture budget", "Unexpected budget"];
  for (let i = 0; i < labels.length; i++) {
    const input = screen.getByLabelText(labels[i]);
    await user.clear(input);
    if (values[i] !== "") await user.type(input, values[i]);
  }
}

describe("BudgetPlanner", () => {
  let backend: ReturnType<typeof installPhase03Backend>;

  beforeEach(() => {
    backend = installPhase03Backend();
  });

  it("shows a loading state, then the missing-plan state with an empty form", async () => {
    backend.on("GET", "/api/v1/budgets/2026-10", notFound);
    render(<Harness />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading budget for October 2026");
    expect(await screen.findByText(/No budget for October 2026 yet/)).toBeInTheDocument();
    expect(screen.getByLabelText("Planned income")).toHaveValue("");
    expect(screen.getByRole("button", { name: "Create budget" })).toBeInTheDocument();
    expect(screen.getByText("Enter a valid amount in every field to see your plan totals.")).toBeInTheDocument();
  });

  it("loads an existing plan and shows the server's saved figures", async () => {
    backend.on("GET", "/api/v1/budgets/2026-10", () => json(200, SAVED));
    render(<Harness />);
    expect(await screen.findByLabelText("Planned income")).toHaveValue("100000.00");
    expect(screen.getByLabelText("Needs budget")).toHaveValue("40000.00");
    const summary = screen.getByRole("complementary");
    expect(within(summary).getByRole("heading", { name: "Saved plan" })).toBeInTheDocument();
    expect(within(summary).getByText("LKR 75,000.00")).toBeInTheDocument();
    expect(within(summary).getByText("LKR 90,000.00")).toBeInTheDocument();
    expect(within(summary).getByText("LKR 10,000.00")).toBeInTheDocument(); // not yet planned
  });

  it("previews totals while editing and labels them as not saved", async () => {
    const user = userEvent.setup();
    backend.on("GET", "/api/v1/budgets/2026-10", notFound);
    render(<Harness />);
    await screen.findByText(/No budget for October 2026 yet/);
    await fillPlan(user, ["100000", "15000", "40000", "20000", "10000", "5000"]);
    const summary = screen.getByRole("complementary");
    expect(within(summary).getByRole("heading", { name: "Preview — not saved yet" })).toBeInTheDocument();
    expect(within(summary).getByText("LKR 75,000.00")).toBeInTheDocument();
    expect(within(summary).getByText("LKR 90,000.00")).toBeInTheDocument();
  });

  it("validates fields before sending anything", async () => {
    const user = userEvent.setup();
    backend.on("GET", "/api/v1/budgets/2026-10", notFound);
    render(<Harness />);
    await screen.findByText(/No budget for October 2026 yet/);
    await fillPlan(user, ["100", "1.234", "", "1", "1", "1"]);
    await user.click(screen.getByRole("button", { name: "Create budget" }));
    expect(await screen.findByText("Savings target must be a number with at most 2 decimal places.")).toBeInTheDocument();
    expect(screen.getByText(/Needs allocation is required/)).toBeInTheDocument();
    expect(screen.getByLabelText("Savings target")).toHaveAttribute("aria-invalid", "true");
    expect(backend.calls.some((c) => c.method === "PUT")).toBe(false);
  });

  it("warns when the plan exceeds planned income, explains why, and still allows saving", async () => {
    const user = userEvent.setup();
    backend.on("GET", "/api/v1/budgets/2026-10", notFound);
    backend.on("PUT", "/api/v1/budgets/2026-10", ({ body }) =>
      json(200, {
        ...SAVED,
        ...(body as object),
        plannedIncome: "80000.00",
        overAllocationAmount: "10000.00",
        overAllocated: true,
      }),
    );
    render(<Harness />);
    await screen.findByText(/No budget for October 2026 yet/);
    await fillPlan(user, ["80000", "15000", "40000", "20000", "10000", "5000"]);
    const summary = screen.getByRole("complementary");
    expect(within(summary).getByText(/Plan exceeds planned income by/)).toHaveTextContent("LKR 10,000.00");
    expect(within(summary).getByText(/Savings target plus group budgets is/)).toHaveTextContent(
      "Savings target plus group budgets is LKR 90,000.00, but planned income is LKR 80,000.00",
    );
    await user.click(screen.getByRole("button", { name: "Create budget" }));
    expect(await screen.findByText("Budget for October 2026 saved.")).toBeInTheDocument();
  });

  it("saves the plan with decimal strings and shows the stored result", async () => {
    const user = userEvent.setup();
    backend.on("GET", "/api/v1/budgets/2026-10", notFound);
    backend.on("PUT", "/api/v1/budgets/2026-10", () => json(200, SAVED));
    render(<Harness />);
    await screen.findByText(/No budget for October 2026 yet/);
    await fillPlan(user, ["100000", "15000", "40000", "20000", "10000", "5000"]);
    await user.click(screen.getByRole("button", { name: "Create budget" }));

    expect(await screen.findByText("Budget for October 2026 saved.")).toBeInTheDocument();
    const put = backend.calls.find((c) => c.method === "PUT")!;
    expect(put.body).toEqual({
      plannedIncome: "100000",
      savingsTarget: "15000",
      allocations: { NEEDS: "40000", WANTS: "20000", CULTURE: "10000", UNEXPECTED: "5000" },
    });
    expect(put.headers["X-XSRF-TOKEN"]).toBe("csrf-token");
    expect(screen.getByLabelText("Planned income")).toHaveValue("100000.00");
    expect(screen.getByRole("heading", { name: "Saved plan" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View dashboard" })).toHaveAttribute("href", "/dashboard?month=2026-10");
  });

  it("never shows success when saving fails, keeps the values, and retries", async () => {
    const user = userEvent.setup();
    backend.on("GET", "/api/v1/budgets/2026-10", notFound);
    backend.once("PUT", "/api/v1/budgets/2026-10", () => apiError(500, "INTERNAL_ERROR", "boom"));
    backend.once("PUT", "/api/v1/budgets/2026-10", () => json(200, SAVED));
    render(<Harness />);
    await screen.findByText(/No budget for October 2026 yet/);
    await fillPlan(user, ["100000", "15000", "40000", "20000", "10000", "5000"]);
    await user.click(screen.getByRole("button", { name: "Create budget" }));

    expect(await screen.findByText(/Your plan was not saved/)).toBeInTheDocument();
    expect(screen.queryByText(/saved\./)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Planned income")).toHaveValue("100000");
    expect(screen.getByRole("heading", { name: "Preview — not saved yet" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Budget for October 2026 saved.")).toBeInTheDocument();
    expect(backend.calls.filter((c) => c.method === "PUT")).toHaveLength(2);
  });

  it("shows server field errors next to the fields", async () => {
    const user = userEvent.setup();
    backend.on("GET", "/api/v1/budgets/2026-10", notFound);
    backend.on("PUT", "/api/v1/budgets/2026-10", () =>
      apiError(400, "VALIDATION_ERROR", "Please correct the highlighted fields.", {
        "allocations.WANTS": "Wants allocation exceeds the maximum allowed amount.",
      }),
    );
    render(<Harness />);
    await screen.findByText(/No budget for October 2026 yet/);
    await fillPlan(user, ["100", "0", "0", "0", "0", "0"]);
    await user.click(screen.getByRole("button", { name: "Create budget" }));
    expect(await screen.findByText("Wants allocation exceeds the maximum allowed amount.")).toBeInTheDocument();
    expect(screen.getByLabelText("Wants budget")).toHaveAttribute("aria-invalid", "true");
  });

  it("reports a network failure honestly", async () => {
    const user = userEvent.setup();
    backend.on("GET", "/api/v1/budgets/2026-10", notFound);
    backend.on("PUT", "/api/v1/budgets/2026-10", () => {
      throw new TypeError("Failed to fetch");
    });
    render(<Harness />);
    await screen.findByText(/No budget for October 2026 yet/);
    await fillPlan(user, ["1", "0", "0", "0", "0", "0"]);
    await user.click(screen.getByRole("button", { name: "Create budget" }));
    expect(await screen.findByText(/Your plan was not saved\. We couldn't reach Divido/)).toBeInTheDocument();
  });

  it("prevents duplicate submissions while saving", async () => {
    const user = userEvent.setup();
    let release: (r: Response) => void = () => {};
    backend.on("GET", "/api/v1/budgets/2026-10", notFound);
    backend.on("PUT", "/api/v1/budgets/2026-10", () => new Promise<Response>((r) => (release = r)) as unknown as Response);
    render(<Harness />);
    await screen.findByText(/No budget for October 2026 yet/);
    await fillPlan(user, ["1", "0", "0", "0", "0", "0"]);
    const button = screen.getByRole("button", { name: "Create budget" });
    await user.click(button);
    expect(await screen.findByRole("button", { name: "Saving…" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Saving…" }));
    release(json(200, SAVED));
    expect(await screen.findByText("Budget for October 2026 saved.")).toBeInTheDocument();
    expect(backend.calls.filter((c) => c.method === "PUT")).toHaveLength(1);
  });

  it("shows a load error with retry instead of an empty plan", async () => {
    const user = userEvent.setup();
    backend.once("GET", "/api/v1/budgets/2026-10", () => apiError(500, "INTERNAL_ERROR", "x"));
    backend.on("GET", "/api/v1/budgets/2026-10", () => json(200, SAVED));
    render(<Harness />);
    expect(await screen.findByText(/We couldn't load your budget/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Planned income")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByLabelText("Planned income")).toHaveValue("100000.00");
  });

  it("navigates months across the year boundary and loads each month", async () => {
    const user = userEvent.setup();
    backend.on("GET", "/api/v1/budgets/2026-12", () => json(200, { ...SAVED, month: "2026-12" }));
    backend.on("GET", "/api/v1/budgets/2027-01", notFound);
    render(<Harness initial="2026-12" />);
    expect(await screen.findByLabelText("Planned income")).toHaveValue("100000.00");
    expect(screen.getByTestId("selected-month")).toHaveTextContent("December 2026");

    await user.click(screen.getByRole("button", { name: "Next month, January 2027" }));
    expect(await screen.findByText(/No budget for January 2027 yet/)).toBeInTheDocument();
    expect(screen.getByLabelText("Planned income")).toHaveValue("");

    await user.click(screen.getByRole("button", { name: "Previous month, December 2026" }));
    await waitFor(() => expect(screen.getByLabelText("Planned income")).toHaveValue("100000.00"));
  });
});
