import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { MobileDock } from "@/components/layout/MobileDock";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

describe("MobileDock Speed-Dial Action Menu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Add button and toggles speed dial menu with Add income and Add expense", async () => {
    const user = userEvent.setup();
    const mockOnAdd = vi.fn();

    render(
      <MobileDock
        onAdd={mockOnAdd}
        userName="Charu"
        email="charu@example.com"
        initials="CP"
      />,
    );

    const addButton = screen.getByRole("button", { name: "Add transaction" });
    expect(addButton).toBeInTheDocument();

    // Speed dial actions should not be visible initially
    expect(screen.queryByRole("menuitem", { name: "Add income" })).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Add expense" })).not.toBeInTheDocument();

    // Tap Add button -> Opens speed dial
    await user.click(addButton);

    const addIncomeBtn = screen.getByRole("menuitem", { name: "Add income" });
    const addExpenseBtn = screen.getByRole("menuitem", { name: "Add expense" });
    expect(addIncomeBtn).toBeInTheDocument();
    expect(addExpenseBtn).toBeInTheDocument();

    // Tap Add income -> Calls onAdd("INCOME")
    await user.click(addIncomeBtn);
    expect(mockOnAdd).toHaveBeenCalledWith("INCOME");
  });

  it("calls onAdd('EXPENSE') when Add expense is clicked", async () => {
    const user = userEvent.setup();
    const mockOnAdd = vi.fn();

    render(
      <MobileDock
        onAdd={mockOnAdd}
        userName="Charu"
        email="charu@example.com"
        initials="CP"
      />,
    );

    const addButton = screen.getByRole("button", { name: "Add transaction" });
    await user.click(addButton);

    const addExpenseBtn = screen.getByRole("menuitem", { name: "Add expense" });
    await user.click(addExpenseBtn);
    expect(mockOnAdd).toHaveBeenCalledWith("EXPENSE");
  });
});

