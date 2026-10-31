import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ExpenseForm } from "@/features/transactions/ExpenseForm";
import { IncomeForm } from "@/features/transactions/IncomeForm";
import { TransactionEditForm } from "@/features/transactions/TransactionEditForm";
import { TransactionFilters } from "@/features/transactions/TransactionFilters";
import { TransactionRow } from "@/features/transactions/TransactionRow";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import type { Transaction } from "@/types/transaction";
import { installFakeBackend } from "./fakeBackend";

const pushMock = vi.fn();
const backMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    back: backMock,
  }),
  usePathname: () => "/transactions",
  useSearchParams: () => new URLSearchParams(),
}));

function renderWithAuth(ui: React.ReactElement) {
  return render(<AuthProvider>{ui}</AuthProvider>);
}

describe("ExpenseForm component", () => {
  let backend: ReturnType<typeof installFakeBackend>;

  beforeEach(() => {
    backend = installFakeBackend();
    backend.state.signedInAs = "test@example.com";
    pushMock.mockClear();
    backMock.mockClear();
  });

  it("validates required fields on empty submit", async () => {
    const user = userEvent.setup();
    renderWithAuth(<ExpenseForm />);

    const submitBtn = screen.getByRole("button", { name: /Save expense/i });
    await user.click(submitBtn);

    expect(await screen.findByText(/Please enter a valid amount greater than 0/i)).toBeInTheDocument();
    expect(await screen.findByText(/Please choose a category/i)).toBeInTheDocument();
  });

  it("submits a valid expense successfully", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    renderWithAuth(<ExpenseForm onSuccess={onSuccess} />);

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Groceries" })).toBeInTheDocument();
    });

    const amountInput = screen.getByLabelText(/Amount \*/i);
    await user.type(amountInput, "2400");

    const categorySelect = screen.getByLabelText(/Category \*/i);
    await user.selectOptions(categorySelect, "cat-1");

    const submitBtn = screen.getByRole("button", { name: /Save expense/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });

    // Check transaction created in backend
    expect(backend.state.transactions.size).toBe(1);
    const created = Array.from(backend.state.transactions.values())[0];
    expect(created.type).toBe("EXPENSE");
    expect(created.amount).toBe("2400.00");
    expect(created.category?.name).toBe("Groceries");
  });

  it("displays error and retains entered values when backend creation fails", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    // Set backend override to simulate a 500 server error on transaction creation
    backend.state.overrides.set("/api/v1/transactions", () =>
      new Response(
        JSON.stringify({
          status: 500,
          code: "INTERNAL_ERROR",
          message: "Database connection failed. Transaction could not be persisted.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      ),
    );

    renderWithAuth(<ExpenseForm onSuccess={onSuccess} />);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Groceries" })).toBeInTheDocument();
    });

    const amountInput = screen.getByLabelText(/Amount \*/i);
    await user.type(amountInput, "3500");

    const categorySelect = screen.getByLabelText(/Category \*/i);
    await user.selectOptions(categorySelect, "cat-1");

    const descInput = screen.getByLabelText(/Description/i);
    await user.type(descInput, "Office party food");

    const submitBtn = screen.getByRole("button", { name: /Save expense/i });
    await user.click(submitBtn);

    // Verify error state is shown and success callbacks are not called
    expect(
      await screen.findByText(/Database connection failed. Transaction could not be persisted./i),
    ).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();

    // Verify form input values are preserved on recoverable error
    expect(amountInput).toHaveValue("3500");
    expect(descInput).toHaveValue("Office party food");
    expect(backend.state.transactions.size).toBe(0);
  });

  it("displays field error when backend rejects validation", async () => {
    const user = userEvent.setup();

    backend.state.overrides.set("/api/v1/transactions", () =>
      new Response(
        JSON.stringify({
          status: 400,
          code: "VALIDATION_FAILED",
          message: "Transaction payload is invalid.",
          fieldErrors: { amount: "Amount exceeds approved ceiling for expense." },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      ),
    );

    renderWithAuth(<ExpenseForm />);

    await waitFor(() => {
      expect(screen.getByRole("option", { name: "Groceries" })).toBeInTheDocument();
    });

    const amountInput = screen.getByLabelText(/Amount \*/i);
    await user.type(amountInput, "9999999");

    const categorySelect = screen.getByLabelText(/Category \*/i);
    await user.selectOptions(categorySelect, "cat-1");

    const submitBtn = screen.getByRole("button", { name: /Save expense/i });
    await user.click(submitBtn);

    expect(
      await screen.findByText(/Amount exceeds approved ceiling for expense./i),
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("displays error message when category list fails to load", async () => {
    backend.state.overrides.set("/api/v1/categories", () =>
      new Response(
        JSON.stringify({ status: 503, code: "SERVICE_UNAVAILABLE", message: "Categories unavailable" }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      ),
    );

    renderWithAuth(<ExpenseForm />);

    expect(
      await screen.findByText(/Unable to load categories. Please refresh./i),
    ).toBeInTheDocument();
  });
});

describe("IncomeForm component", () => {
  let backend: ReturnType<typeof installFakeBackend>;

  beforeEach(() => {
    backend = installFakeBackend();
    backend.state.signedInAs = "test@example.com";
  });

  it("validates required amount and submits valid income", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    renderWithAuth(<IncomeForm onSuccess={onSuccess} />);

    const submitBtn = screen.getByRole("button", { name: /Save income/i });
    await user.click(submitBtn);

    expect(await screen.findByText(/Please enter a valid amount greater than 0/i)).toBeInTheDocument();

    const amountInput = screen.getByLabelText(/Amount \*/i);
    await user.type(amountInput, "85000");

    await user.click(submitBtn);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });

    expect(backend.state.transactions.size).toBe(1);
    const created = Array.from(backend.state.transactions.values())[0];
    expect(created.type).toBe("INCOME");
    expect(created.amount).toBe("85000.00");
  });

  it("displays error and retains entered values when backend income creation fails", async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    backend.state.overrides.set("/api/v1/transactions", () =>
      new Response(
        JSON.stringify({
          status: 500,
          code: "INTERNAL_ERROR",
          message: "Income recording failed due to a server error.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      ),
    );

    renderWithAuth(<IncomeForm onSuccess={onSuccess} />);

    const amountInput = screen.getByLabelText(/Amount \*/i);
    await user.type(amountInput, "95000");

    const descInput = screen.getByLabelText(/Description/i);
    await user.type(descInput, "Consulting fee");

    const submitBtn = screen.getByRole("button", { name: /Save income/i });
    await user.click(submitBtn);

    expect(
      await screen.findByText(/Income recording failed due to a server error./i),
    ).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(amountInput).toHaveValue("95000");
    expect(descInput).toHaveValue("Consulting fee");
    expect(backend.state.transactions.size).toBe(0);
  });

  it("displays error message when income sources fail to load", async () => {
    backend.state.overrides.set("/api/v1/income-sources", () =>
      new Response(
        JSON.stringify({ status: 500, code: "INTERNAL_ERROR", message: "Failed to load sources" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      ),
    );

    renderWithAuth(<IncomeForm />);

    expect(
      await screen.findByText(/Unable to load income sources./i),
    ).toBeInTheDocument();
  });
});

describe("TransactionRow component", () => {
  it("renders expense row with group badge and formatted amount", () => {
    const mockExpense: Transaction = {
      id: "tx-1",
      type: "EXPENSE",
      amount: "2400.00",
      date: "2026-10-12",
      category: { id: "cat-1", name: "Supermarket", group: "NEEDS" },
      description: "Weekly groceries",
      paymentMethod: "CASH",
      createdAt: "2026-10-12T08:00:00Z",
      updatedAt: "2026-10-12T08:00:00Z",
    };

    render(<TransactionRow transaction={mockExpense} />);

    expect(screen.getByText("Supermarket")).toBeInTheDocument();
    expect(screen.getByText("Needs")).toBeInTheDocument();
    expect(screen.getByText("Weekly groceries")).toBeInTheDocument();
    expect(screen.getByText("CASH")).toBeInTheDocument();
    expect(screen.getByText("LKR 2,400.00")).toBeInTheDocument();
  });
});

describe("TransactionFilters component", () => {
  it("allows switching tabs and month", async () => {
    const user = userEvent.setup();
    const onTypeChange = vi.fn();
    const onMonthChange = vi.fn();

    render(
      <TransactionFilters
        currentMonth="2026-10"
        onTypeChange={onTypeChange}
        onMonthChange={onMonthChange}
      />,
    );

    const expenseTab = screen.getByRole("tab", { name: "Expenses" });
    await user.click(expenseTab);
    expect(onTypeChange).toHaveBeenCalledWith("EXPENSE");

    const incomeTab = screen.getByRole("tab", { name: "Income" });
    await user.click(incomeTab);
    expect(onTypeChange).toHaveBeenCalledWith("INCOME");
  });
});

describe("TransactionEditForm component", () => {
  let backend: ReturnType<typeof installFakeBackend>;

  const mockTransaction: Transaction = {
    id: "tx-99",
    type: "EXPENSE",
    amount: "1500.00",
    date: "2026-10-10",
    category: { id: "cat-1", name: "Groceries", group: "NEEDS" },
    description: "Old description",
    paymentMethod: "CASH",
    createdAt: "2026-10-10T08:00:00Z",
    updatedAt: "2026-10-10T08:00:00Z",
  };

  beforeEach(() => {
    backend = installFakeBackend();
    backend.state.signedInAs = "test@example.com";
    backend.state.transactions.set(mockTransaction.id, mockTransaction);
    pushMock.mockClear();
  });

  it("updates amount and saves successfully", async () => {
    const user = userEvent.setup();
    renderWithAuth(<TransactionEditForm transaction={mockTransaction} />);

    const amountInput = screen.getByLabelText(/Amount \*/i);
    await user.clear(amountInput);
    await user.type(amountInput, "1800");

    const saveBtn = screen.getByRole("button", { name: /Save changes/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/transactions?notice=updated");
    });

    const updated = backend.state.transactions.get("tx-99");
    expect(updated?.amount).toBe("1800.00");
  });

  it("displays error and prevents redirect when update fails", async () => {
    const user = userEvent.setup();

    backend.state.overrides.set("/api/v1/transactions/tx-99", () =>
      new Response(
        JSON.stringify({
          status: 500,
          code: "INTERNAL_ERROR",
          message: "Update failed on server.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      ),
    );

    renderWithAuth(<TransactionEditForm transaction={mockTransaction} />);

    const amountInput = screen.getByLabelText(/Amount \*/i);
    await user.clear(amountInput);
    await user.type(amountInput, "2500");

    const saveBtn = screen.getByRole("button", { name: /Save changes/i });
    await user.click(saveBtn);

    expect(await screen.findByText(/Update failed on server./i)).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
    // Verify state was not updated
    const unmod = backend.state.transactions.get("tx-99");
    expect(unmod?.amount).toBe("1500.00");
  });

  it("confirms and deletes transaction", async () => {
    const user = userEvent.setup();
    renderWithAuth(<TransactionEditForm transaction={mockTransaction} />);

    const deleteBtn = screen.getByRole("button", { name: "Delete" });
    await user.click(deleteBtn);

    // Confirmation dialog appears
    const confirmBtn = await screen.findByRole("button", { name: /Yes, delete/i });
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/transactions?notice=deleted");
    });

    expect(backend.state.transactions.has("tx-99")).toBe(false);
  });

  it("displays error and retains transaction when deletion fails", async () => {
    const user = userEvent.setup();

    backend.state.overrides.set("/api/v1/transactions/tx-99", () =>
      new Response(
        JSON.stringify({
          status: 500,
          code: "INTERNAL_ERROR",
          message: "Server failed to delete transaction.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      ),
    );

    renderWithAuth(<TransactionEditForm transaction={mockTransaction} />);

    const deleteBtn = screen.getByRole("button", { name: "Delete" });
    await user.click(deleteBtn);

    const confirmBtn = await screen.findByRole("button", { name: /Yes, delete/i });
    await user.click(confirmBtn);

    expect(
      await screen.findByText(/Could not delete transaction. Please try again./i),
    ).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalled();
    expect(backend.state.transactions.has("tx-99")).toBe(true);
  });
});
