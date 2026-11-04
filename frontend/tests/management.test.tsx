import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TransactionsPage from "@/app/transactions/page";
import { CategoryManager } from "@/features/categories/CategoryManager";
import { IncomeSourceManager } from "@/features/income-sources/IncomeSourceManager";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { getTodayIso } from "@/lib/formatting/dates";
import type { Transaction } from "@/types/transaction";
import { installFakeBackend } from "./fakeBackend";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/categories",
  useSearchParams: () => new URLSearchParams(),
}));

function renderWithAuth(ui: React.ReactElement) {
  return render(<AuthProvider>{ui}</AuthProvider>);
}

function serverError(message: string) {
  return () =>
    new Response(JSON.stringify({ status: 500, code: "INTERNAL_ERROR", message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
}

describe("CategoryManager", () => {
  let backend: ReturnType<typeof installFakeBackend>;

  beforeEach(() => {
    backend = installFakeBackend();
    backend.state.signedInAs = "test@example.com";
  });

  it("lists the three defaults without edit or deactivate controls", async () => {
    renderWithAuth(<CategoryManager />);
    const section = await screen.findByRole("region", { name: "Default categories" });
    expect(within(section).getByText("Groceries")).toBeInTheDocument();
    expect(within(section).getByText("Transport")).toBeInTheDocument();
    expect(within(section).getByText("Entertainment")).toBeInTheDocument();
    expect(within(section).queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("No custom categories yet")).toBeInTheDocument();
  });

  it("creates a custom category and shows it only after the server confirms", async () => {
    const user = userEvent.setup();
    renderWithAuth(<CategoryManager />);
    await screen.findByText("Groceries");

    await user.type(screen.getByLabelText("Category name"), "Books");
    await user.selectOptions(screen.getByLabelText("Kakeibo group"), "CULTURE");
    await user.click(screen.getByRole("button", { name: "Add category" }));

    expect(await screen.findByText('Category "Books" created.')).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Edit Books" })).toBeInTheDocument();
    expect(backend.state.customCategories).toHaveLength(1);
  });

  it("shows the conflict message and no success when the name already exists", async () => {
    const user = userEvent.setup();
    renderWithAuth(<CategoryManager />);
    await screen.findByText("Groceries");

    await user.type(screen.getByLabelText("Category name"), "groceries");
    await user.selectOptions(screen.getByLabelText("Kakeibo group"), "NEEDS");
    await user.click(screen.getByRole("button", { name: "Add category" }));

    expect(await screen.findByText(/already exists/i)).toBeInTheDocument();
    expect(screen.queryByText(/created\./)).not.toBeInTheDocument();
    expect(backend.state.customCategories).toHaveLength(0);
  });

  it("validates name and group before sending", async () => {
    const user = userEvent.setup();
    renderWithAuth(<CategoryManager />);
    await screen.findByText("Groceries");
    const before = backend.state.calls.length;

    await user.click(screen.getByRole("button", { name: "Add category" }));

    expect(screen.getByText("Please enter a category name.")).toBeInTheDocument();
    expect(screen.getByText("Please choose a Kakeibo group.")).toBeInTheDocument();
    expect(backend.state.calls.slice(before).some((c) => c.method === "POST")).toBe(false);
  });

  it("deactivates a custom category after confirmation", async () => {
    const user = userEvent.setup();
    backend.state.customCategories.push({ id: "cat-c1", name: "Hobbies", group: "WANTS", isDefault: false, active: true });
    renderWithAuth(<CategoryManager />);

    await user.click(await screen.findByRole("button", { name: "Deactivate Hobbies" }));
    await user.click(await screen.findByRole("button", { name: "Deactivate" }));

    expect(await screen.findByText('Category "Hobbies" deactivated.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("button", { name: "Edit Hobbies" })).not.toBeInTheDocument());
    expect(backend.state.customCategories[0].active).toBe(false);
  });

  it("keeps the category and reports an error when deactivation fails", async () => {
    const user = userEvent.setup();
    backend.state.customCategories.push({ id: "cat-c1", name: "Hobbies", group: "WANTS", isDefault: false, active: true });
    backend.state.overrides.set("/api/v1/categories/cat-c1/deactivate", serverError("Something went wrong on our side."));
    renderWithAuth(<CategoryManager />);

    await user.click(await screen.findByRole("button", { name: "Deactivate Hobbies" }));
    await user.click(await screen.findByRole("button", { name: "Deactivate" }));

    expect(await screen.findByText("Something went wrong on our side.")).toBeInTheDocument();
    expect(screen.queryByText(/deactivated\./)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit Hobbies" })).toBeInTheDocument();
    expect(backend.state.customCategories[0].active).toBe(true);
  });

  it("renames a custom category", async () => {
    const user = userEvent.setup();
    backend.state.customCategories.push({ id: "cat-c1", name: "Hobbies", group: "WANTS", isDefault: false, active: true });
    renderWithAuth(<CategoryManager />);

    await user.click(await screen.findByRole("button", { name: "Edit Hobbies" }));
    const form = screen.getByRole("form", { name: "Edit Hobbies" });
    const input = within(form).getByLabelText("Category name");
    await user.clear(input);
    await user.type(input, "Crafts");
    await user.click(within(form).getByRole("button", { name: "Save" }));

    expect(await screen.findByText('Category "Crafts" updated.')).toBeInTheDocument();
    const patch = backend.callsTo("/api/v1/categories/cat-c1").find((c) => c.method === "PATCH");
    expect(patch?.body).toEqual({ name: "Crafts" });
  });
});

describe("IncomeSourceManager", () => {
  let backend: ReturnType<typeof installFakeBackend>;

  beforeEach(() => {
    backend = installFakeBackend();
    backend.state.signedInAs = "test@example.com";
  });

  it("creates an income source after the server confirms", async () => {
    const user = userEvent.setup();
    renderWithAuth(<IncomeSourceManager />);
    await screen.findByText("Monthly Salary");

    await user.type(screen.getByLabelText("Income source name"), "Rental");
    await user.click(screen.getByRole("button", { name: "Add income source" }));

    expect(await screen.findByText('Income source "Rental" created.')).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Edit Rental" })).toBeInTheDocument();
  });

  it("shows no success when creation fails", async () => {
    const user = userEvent.setup();
    backend.state.overrides.set("/api/v1/income-sources", serverError("Something went wrong on our side."));
    renderWithAuth(<IncomeSourceManager />);
    // The override is consumed by the first GET; wait for the error, then retry.
    expect(await screen.findByText("Something went wrong on our side.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    await screen.findByText("Monthly Salary");

    backend.state.overrides.set("/api/v1/income-sources", serverError("Could not save right now."));
    await user.type(screen.getByLabelText("Income source name"), "Rental");
    await user.click(screen.getByRole("button", { name: "Add income source" }));

    expect(await screen.findByText("Could not save right now.")).toBeInTheDocument();
    expect(screen.queryByText(/created\./)).not.toBeInTheDocument();
    expect(backend.state.customIncomeSources).toHaveLength(0);
  });

  it("deactivates a source and can show it again with 'Show inactive'", async () => {
    const user = userEvent.setup();
    renderWithAuth(<IncomeSourceManager />);

    await user.click(await screen.findByRole("button", { name: "Deactivate Freelance" }));
    await user.click(await screen.findByRole("button", { name: "Deactivate" }));
    expect(await screen.findByText('Income source "Freelance" deactivated.')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByText("Freelance")).not.toBeInTheDocument());

    await user.click(screen.getByLabelText("Show inactive"));
    expect(await screen.findByText("Freelance")).toBeInTheDocument();
    expect(screen.getByText("Inactive")).toBeInTheDocument();
    expect(backend.callsTo("/api/v1/income-sources").some((c) => c.url.includes("includeInactive=true"))).toBe(true);
  });
});

describe("Transactions page filters", () => {
  let backend: ReturnType<typeof installFakeBackend>;

  function tx(id: string, partial: Partial<Transaction>): Transaction {
    return {
      id,
      type: "EXPENSE",
      amount: "100.00",
      date: getTodayIso(),
      category: null,
      incomeSource: null,
      createdAt: "2026-10-10T08:00:00Z",
      updatedAt: "2026-10-10T08:00:00Z",
      ...partial,
    };
  }

  beforeEach(() => {
    backend = installFakeBackend();
    backend.state.signedInAs = "test@example.com";
    backend.state.transactions.set("t1", tx("t1", { description: "Rice", category: { id: "cat-1", name: "Groceries", group: "NEEDS" } }));
    backend.state.transactions.set("t2", tx("t2", { description: "Bus", category: { id: "cat-2", name: "Transport", group: "NEEDS" } }));
  });

  it("sends the category filter to the API and shows only the matching records", async () => {
    const user = userEvent.setup();
    renderWithAuth(<TransactionsPage />);
    expect(await screen.findByText("Rice")).toBeInTheDocument();
    expect(screen.getByText("Bus")).toBeInTheDocument();

    await waitFor(() => expect(screen.getByRole("option", { name: "Transport" })).toBeInTheDocument());
    await user.selectOptions(screen.getByLabelText("Category:"), "cat-2");

    await waitFor(() => expect(screen.queryByText("Rice")).not.toBeInTheDocument());
    expect(screen.getByText("Bus")).toBeInTheDocument();
    const lastList = backend.callsTo("/api/v1/transactions").at(-1);
    expect(lastList?.url).toContain("categoryId=cat-2");
    expect(lastList?.url).toContain("page=0");
  });

  it("shows a filtered empty state with a working clear action", async () => {
    const user = userEvent.setup();
    renderWithAuth(<TransactionsPage />);
    await screen.findByText("Rice");

    await user.click(screen.getByRole("tab", { name: "Income" }));
    expect(await screen.findByText("No transactions match these filters")).toBeInTheDocument();

    const clearButtons = screen.getAllByRole("button", { name: "Clear filters" });
    await user.click(clearButtons[clearButtons.length - 1]);
    expect(await screen.findByText("Rice")).toBeInTheDocument();
  });

  it("shows an error with retry, never stale or sample records, when loading fails", async () => {
    const user = userEvent.setup();
    backend.state.overrides.set("/api/v1/transactions", serverError("Something went wrong on our side."));
    renderWithAuth(<TransactionsPage />);

    expect(await screen.findByText(/Could not load transactions/i)).toBeInTheDocument();
    expect(screen.queryByText("Rice")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Rice")).toBeInTheDocument();
  });
});
