import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BudgetPage } from "@/features/budget/BudgetPage";
import type { Dashboard, MonthlyBudget } from "@/types/budget";
import { apiError, installPhase03Backend, json } from "./phase03Backend";
import { renderWithShellStub } from "./shell";

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

const SPENDING: Pick<Dashboard, "groups"> = {
  groups: [
    { group: "NEEDS", budget: "40000.00", spent: "41250.50", remaining: "-1250.50", percentUsed: "103.1", overBudget: true, expenseCount: 2 },
    { group: "WANTS", budget: "20000.00", spent: "5000.00", remaining: "15000.00", percentUsed: "25.0", overBudget: false, expenseCount: 1 },
    { group: "CULTURE", budget: "10000.00", spent: "0.00", remaining: "10000.00", percentUsed: "0.0", overBudget: false, expenseCount: 0 },
    { group: "UNEXPECTED", budget: "5000.00", spent: "0.00", remaining: "5000.00", percentUsed: "0.0", overBudget: false, expenseCount: 0 },
  ],
};

const LABELS = [
  "Planned income",
  "Monthly savings target",
  "Needs planned amount",
  "Wants planned amount",
  "Culture planned amount",
  "Unexpected planned amount",
];

function Harness({ initial = "2026-10" }: { initial?: string }) {
  const [month, setMonth] = useState(initial);
  return <BudgetPage month={month} onMonthChange={setMonth} />;
}

const notFound = () => apiError(404, "BUDGET_NOT_FOUND", "No budget has been set for this month.");
const field = (label: string) => screen.getByLabelText(label);

async function fillPlan(user: ReturnType<typeof userEvent.setup>, values: string[]) {
  for (let i = 0; i < LABELS.length; i++) {
    await user.clear(field(LABELS[i]));
    if (values[i] !== "") await user.type(field(LABELS[i]), values[i]);
  }
}

let backend: ReturnType<typeof installPhase03Backend>;

beforeEach(() => {
  backend = installPhase03Backend();
  backend.on("GET", "/api/v1/auth/me", () => apiError(401, "UNAUTHENTICATED", "Please sign in to continue."));
  backend.on("GET", "/api/v1/dashboard", () => json(200, SPENDING));
});

describe("Monthly budget (BUDGET-001/002)", () => {
  it("shows loading, then an empty form when no plan is saved", async () => {
    backend.on("GET", "/api/v1/budgets/2026-10", notFound);
    renderWithShellStub(<Harness />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading your plan…");
    expect(await screen.findByText("No plan saved for October 2026 yet")).toBeInTheDocument();
    expect(field("Planned income")).toHaveValue("");
    expect(screen.getByText("Fill in every amount to see totals")).toBeInTheDocument();
  });

  it("loads a saved plan and shows the server's figures and spending", async () => {
    backend.on("GET", "/api/v1/budgets/2026-10", () => json(200, SAVED));
    renderWithShellStub(<Harness />);
    expect(await screen.findByText("Plan for October 2026")).toBeInTheDocument();
    expect(field("Needs planned amount")).toHaveValue("40000.00");
    expect(screen.getByText("Saved plan")).toBeInTheDocument();
    expect(screen.getByText("Left unplanned").nextElementSibling).toHaveTextContent("LKR 10,000.00");
    expect(screen.getByText("LKR 90,000.00")).toBeInTheDocument();
    expect(await screen.findByText("Over plan")).toBeInTheDocument();
    expect(screen.getByText("103.1% of the saved amount used")).toBeInTheDocument();
  });

  it("previews exact totals while editing and marks them unsaved", async () => {
    const user = userEvent.setup();
    backend.on("GET", "/api/v1/budgets/2026-10", notFound);
    renderWithShellStub(<Harness />);
    await screen.findByText("No plan saved for October 2026 yet");
    await fillPlan(user, ["100000.10", "15000.05", "40000", "20000", "10000", "5000.05"]);
    expect(screen.getByText("Not saved yet")).toBeInTheDocument();
    expect(screen.getByText("LKR 90,000.10")).toBeInTheDocument();
    expect(screen.getByText("Left unplanned").nextElementSibling).toHaveTextContent("LKR 10,000.00");
  });

  it("validates before sending anything and focuses the first invalid field", async () => {
    const user = userEvent.setup();
    backend.on("GET", "/api/v1/budgets/2026-10", notFound);
    renderWithShellStub(<Harness />);
    await screen.findByText("No plan saved for October 2026 yet");
    await user.click(screen.getByRole("button", { name: "Save plan" }));

    await waitFor(() => expect(field("Planned income")).toHaveFocus());
    expect(field("Planned income")).toHaveAttribute("aria-invalid", "true");
    expect(backend.calls.some((c) => c.method === "PUT")).toBe(false);
  });

  it("warns when the plan is above planned income but still saves (DEC-012)", async () => {
    const user = userEvent.setup();
    backend.on("GET", "/api/v1/budgets/2026-10", notFound);
    backend.on("PUT", "/api/v1/budgets/2026-10", ({ body }) =>
      json(200, { ...SAVED, ...(body as object), plannedIncome: "80000.00", overAllocationAmount: "10000.00", overAllocated: true }),
    );
    const { actions } = renderWithShellStub(<Harness />);
    await screen.findByText("No plan saved for October 2026 yet");
    await fillPlan(user, ["80000", "15000", "40000", "20000", "10000", "5000"]);
    expect(screen.getByText(/LKR 10,000\.00 above your planned income/).closest('[role="status"]')).not.toBeNull();
    expect(screen.getByText("Above planned income")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Save plan" }));
    await waitFor(() => expect(actions.notify).toHaveBeenCalledWith("Plan for October 2026 saved"));
  });

  it("saves decimal strings and then shows the stored amounts", async () => {
    const user = userEvent.setup();
    backend.on("GET", "/api/v1/budgets/2026-10", notFound);
    backend.on("PUT", "/api/v1/budgets/2026-10", () => json(200, SAVED));
    const { actions } = renderWithShellStub(<Harness />);
    await screen.findByText("No plan saved for October 2026 yet");
    await fillPlan(user, ["100000", "15000", "40000", "20000", "10000", "5000"]);
    await user.click(screen.getByRole("button", { name: "Save plan" }));

    await waitFor(() => expect(actions.notify).toHaveBeenCalledWith("Plan for October 2026 saved"));
    const put = backend.calls.find((c) => c.method === "PUT")!;
    expect(put.body).toEqual({
      plannedIncome: "100000",
      savingsTarget: "15000",
      allocations: { NEEDS: "40000", WANTS: "20000", CULTURE: "10000", UNEXPECTED: "5000" },
    });
    expect(put.headers["X-XSRF-TOKEN"]).toBe("csrf-token");
    expect(field("Planned income")).toHaveValue("100000.00");
    expect(screen.getByText("Saved plan")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reset changes" })).toBeDisabled();
  });

  it("never reports success when saving fails and keeps the entries", async () => {
    const user = userEvent.setup();
    backend.on("GET", "/api/v1/budgets/2026-10", notFound);
    backend.once("PUT", "/api/v1/budgets/2026-10", () => apiError(500, "INTERNAL_ERROR", "boom"));
    backend.once("PUT", "/api/v1/budgets/2026-10", () => json(200, SAVED));
    const { actions } = renderWithShellStub(<Harness />);
    await screen.findByText("No plan saved for October 2026 yet");
    await fillPlan(user, ["100000", "15000", "40000", "20000", "10000", "5000"]);
    await user.click(screen.getByRole("button", { name: "Save plan" }));

    expect(await screen.findByText(/Your plan was not saved/)).toBeInTheDocument();
    expect(screen.queryByText(/boom/)).not.toBeInTheDocument();
    expect(actions.notify).not.toHaveBeenCalled();
    expect(field("Planned income")).toHaveValue("100000");

    await user.click(screen.getByRole("button", { name: "Save plan" }));
    await waitFor(() => expect(actions.notify).toHaveBeenCalledWith("Plan for October 2026 saved"));
  });

  it("shows server field errors next to their fields", async () => {
    const user = userEvent.setup();
    backend.on("GET", "/api/v1/budgets/2026-10", notFound);
    backend.on("PUT", "/api/v1/budgets/2026-10", () =>
      apiError(400, "VALIDATION_ERROR", "Invalid", { "allocations.WANTS": "Amount is too large." }),
    );
    renderWithShellStub(<Harness />);
    await screen.findByText("No plan saved for October 2026 yet");
    await fillPlan(user, ["100000", "15000", "40000", "20000", "10000", "5000"]);
    await user.click(screen.getByRole("button", { name: "Save plan" }));

    expect(await screen.findByText("Amount is too large.")).toBeInTheDocument();
    await waitFor(() => expect(field("Wants planned amount")).toHaveFocus());
  });

  it("shows a load error with retry instead of an empty plan", async () => {
    const user = userEvent.setup();
    backend.once("GET", "/api/v1/budgets/2026-10", () => apiError(500, "INTERNAL_ERROR", "boom"));
    backend.on("GET", "/api/v1/budgets/2026-10", () => json(200, SAVED));
    renderWithShellStub(<Harness />);
    expect(await screen.findByText(/couldn't load your plan/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Planned income")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Plan for October 2026")).toBeInTheDocument();
  });

  it("loads each month when stepping across the year boundary", async () => {
    const user = userEvent.setup();
    backend.on("GET", "/api/v1/budgets/2026-12", notFound);
    backend.on("GET", "/api/v1/budgets/2027-01", notFound);
    renderWithShellStub(<Harness initial="2026-12" />);
    await screen.findByText("No plan saved for December 2026 yet");
    await user.click(screen.getByRole("button", { name: "Next month" }));
    expect(await screen.findByText("No plan saved for January 2027 yet")).toBeInTheDocument();
  });
});
