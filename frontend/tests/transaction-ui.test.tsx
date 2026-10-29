import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TransactionForm } from "@/features/transactions/TransactionForm";
import { TransactionFilters } from "@/features/transactions/TransactionFilters";

describe("transaction UI foundation", () => {
  it("keeps unapproved filters visibly unavailable", () => {
    render(<TransactionFilters />);

    expect(screen.getByRole("button", { name: /october 2026/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /all types/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /all categories/i })).toBeDisabled();
  });

  it("does not attempt to save an expense before the contract is integrated", async () => {
    const user = userEvent.setup();
    render(<TransactionForm mode="expense" />);

    await user.type(screen.getByLabelText(/amount/i), "2400");
    await user.click(screen.getByRole("button", { name: "Save expense" }));

    expect(screen.getByRole("status")).toHaveTextContent(/saving will be enabled/i);
    expect(screen.getByLabelText(/category/i)).toBeDisabled();
  });

  it("uses income-specific labels", () => {
    render(<TransactionForm mode="income" />);

    expect(screen.getByRole("heading", { name: "Add income" })).toBeInTheDocument();
    expect(screen.getByLabelText(/income source/i)).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save income" })).toBeEnabled();
  });
});
