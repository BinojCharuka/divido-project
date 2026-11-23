import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TransactionsPage } from "@/features/transactions/TransactionsPage";
import { buildTransactionPatch } from "@/lib/transactions/patch";
import { getCurrentMonth } from "@/lib/formatting/dates";
import { clearCsrfToken } from "@/lib/api/client";
import type { Transaction } from "@/types/transaction";
import { installFakeBackend } from "./fakeBackend";
import { renderInShell } from "./shell";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/transactions",
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const month = getCurrentMonth();
const day = (d: number) => `${month}-${String(d).padStart(2, "0")}`;

function seed(backend: ReturnType<typeof installFakeBackend>, tx: Partial<Transaction> & Pick<Transaction, "id" | "type" | "amount">) {
  backend.state.transactions.set(tx.id, {
    date: day(5),
    category: null,
    incomeSource: null,
    description: null,
    paymentMethod: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...tx,
  } as Transaction);
}

function Harness() {
  const [m, setM] = useState(month);
  return <TransactionsPage month={m} onMonthChange={setM} />;
}

let backend: ReturnType<typeof installFakeBackend>;

beforeEach(() => {
  clearCsrfToken();
  backend = installFakeBackend();
  backend.state.signedInAs = "user@example.com";
  backend.state.accounts.set("user@example.com", { password: "x" });
});

describe("recording transactions (TXN-001, TXN-002)", () => {
  it("validates an expense before sending anything", async () => {
    const user = userEvent.setup();
    renderInShell(<Harness />);
    await user.click((await screen.findAllByRole("button", { name: "Add transaction" }))[0]);
    await user.click(within(await screen.findByRole("dialog", { name: "Add transaction" })).getByRole("button", { name: /Add expense/ }));

    const dialog = await screen.findByRole("dialog", { name: "Record an expense" });
    await user.click(within(dialog).getByRole("button", { name: "Save expense" }));

    expect(await within(dialog).findByText(/valid amount/i)).toBeInTheDocument();
    expect(within(dialog).getByText("Please choose a category.")).toBeInTheDocument();
    expect(backend.callsTo("/api/v1/transactions").filter((c) => c.method === "POST")).toHaveLength(0);
  });

  it("saves an expense with a decimal-string amount and shows it once the server confirms", async () => {
    const user = userEvent.setup();
    renderInShell(<Harness />);
    expect(await screen.findByText(`No transactions in ${new Date(`${month}-01T00:00:00`).toLocaleString("en", { month: "long" })}`, { exact: false })).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "Add transaction" })[0]);
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: /Add expense/ }));
    const dialog = await screen.findByRole("dialog", { name: "Record an expense" });
    await user.type(within(dialog).getByLabelText(/^Amount/), "1250.5");
    await waitFor(() => expect(within(dialog).getByRole("option", { name: /Groceries/ })).toBeInTheDocument());
    await user.selectOptions(within(dialog).getByLabelText(/^Category/), "cat-1");
    await user.type(within(dialog).getByLabelText(/^Description/), "Weekly shop");
    await user.click(within(dialog).getByRole("button", { name: "Save expense" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Expense saved");
    const [post] = backend.callsTo("/api/v1/transactions").filter((c) => c.method === "POST");
    expect(post.body).toMatchObject({ type: "EXPENSE", amount: "1250.50", categoryId: "cat-1", description: "Weekly shop" });
    expect(await screen.findByRole("button", { name: /Weekly shop, expense of LKR 1,250\.50/ })).toBeInTheDocument();
  });

  it("keeps the entries and shows the server's error when saving fails", async () => {
    const user = userEvent.setup();
    renderInShell(<Harness />);
    await user.click((await screen.findAllByRole("button", { name: "Add transaction" }))[0]);
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: /Add expense/ }));
    const dialog = await screen.findByRole("dialog", { name: "Record an expense" });
    await user.type(within(dialog).getByLabelText(/^Amount/), "900");
    await waitFor(() => expect(within(dialog).getByRole("option", { name: /Transport/ })).toBeInTheDocument());
    await user.selectOptions(within(dialog).getByLabelText(/^Category/), "cat-2");

    backend.fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await user.click(within(dialog).getByRole("button", { name: "Save expense" }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent("couldn't reach Divido");
    expect(within(dialog).getByLabelText(/^Amount/)).toHaveValue("900");
    expect(screen.queryByText("Expense saved")).not.toBeInTheDocument();
  });

  it("records income without an income source (DEC-003)", async () => {
    const user = userEvent.setup();
    renderInShell(<Harness />);
    await user.click((await screen.findAllByRole("button", { name: "Add transaction" }))[0]);
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: /Add income/ }));
    const dialog = await screen.findByRole("dialog", { name: "Record income" });
    await user.type(within(dialog).getByLabelText(/^Amount/), "50000");
    await user.click(within(dialog).getByRole("button", { name: "Save income" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Income added");
    const [post] = backend.callsTo("/api/v1/transactions").filter((c) => c.method === "POST");
    expect(post.body).toMatchObject({ type: "INCOME", amount: "50000.00" });
    expect(post.body).not.toHaveProperty("incomeSourceId");
  });

  it("allows creating an income source inline and auto-selects it", async () => {
    const user = userEvent.setup();
    renderInShell(<Harness />);
    await user.click((await screen.findAllByRole("button", { name: "Add transaction" }))[0]);
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: /Add income/ }));
    const dialog = await screen.findByRole("dialog", { name: "Record income" });

    // Click "Create an income source"
    const addSourceBtn = within(dialog).getByRole("button", { name: /Create an income source|Add new source/ });
    await user.click(addSourceBtn);

    // Type the source name and submit
    const input = within(dialog).getByPlaceholderText("e.g. Salary, Freelance, Rent");
    await user.type(input, "Freelance Work");
    await user.click(within(dialog).getByRole("button", { name: "Add" }));

    // Verify it is created and selected in the select field
    const select = within(dialog).getByLabelText(/^Income source/);
    expect(within(select).getByRole("option", { name: "Freelance Work" })).toBeInTheDocument();
    expect(select).not.toHaveValue("");

    // Submit transaction
    await user.type(within(dialog).getByLabelText(/^Amount/), "75000");
    await user.click(within(dialog).getByRole("button", { name: "Save income" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Income added");
    const [post] = backend.callsTo("/api/v1/transactions").filter((c) => c.method === "POST" && (c.body as { amount?: string })?.amount === "75000.00");
    expect(post.body).toMatchObject({ type: "INCOME", amount: "75000.00" });
    expect(post.body).toHaveProperty("incomeSourceId");
  });

  it("allows creating a category under Culture or Unexpected inline and auto-selects it", async () => {
    const user = userEvent.setup();
    renderInShell(<Harness />);
    await user.click((await screen.findAllByRole("button", { name: "Add transaction" }))[0]);
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: /Add expense/ }));
    const dialog = await screen.findByRole("dialog", { name: "Record an expense" });

    // Click "Add Culture"
    const addCultureBtn = within(dialog).getByRole("button", { name: /Add Culture/ });
    await user.click(addCultureBtn);

    // Type the category name and submit
    const input = within(dialog).getByPlaceholderText(/Books, Courses/);
    await user.type(input, "Books & Reading");
    await user.click(within(dialog).getByRole("button", { name: "Add" }));

    // Verify it is created and selected in the select field under Culture
    const select = within(dialog).getByLabelText(/^Category/);
    expect(within(select).getByRole("option", { name: /Books & Reading/ })).toBeInTheDocument();
    expect(select).not.toHaveValue("");

    // Submit transaction
    await user.type(within(dialog).getByLabelText(/^Amount/), "3500");
    await user.click(within(dialog).getByRole("button", { name: "Save expense" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Expense saved");
    const [post] = backend.callsTo("/api/v1/transactions").filter((c) => c.method === "POST" && (c.body as { amount?: string })?.amount === "3500.00");
    expect(post.body).toMatchObject({ type: "EXPENSE", amount: "3500.00" });
    expect(post.body).toHaveProperty("categoryId");
  });

  it("supports quick date buttons and interactive calendar picker on mobile and desktop", async () => {
    const user = userEvent.setup();
    renderInShell(<Harness />);
    await user.click((await screen.findAllByRole("button", { name: "Add transaction" }))[0]);
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: /Add expense/ }));
    const dialog = await screen.findByRole("dialog", { name: "Record an expense" });

    const dateInput = within(dialog).getByLabelText(/^Date/);

    // Click "Yesterday"
    await user.click(within(dialog).getByRole("button", { name: "Yesterday" }));
    expect(dateInput).not.toHaveValue("");

    // Click "Today"
    await user.click(within(dialog).getByRole("button", { name: "Today" }));
    expect(dateInput).toHaveValue(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" }));

    // Click "Pick date" to open interactive calendar
    await user.click(within(dialog).getByRole("button", { name: "Toggle calendar picker" }));
    expect(within(dialog).getByRole("grid", { name: "Calendar dates" })).toBeInTheDocument();

    // Select a date cell in the grid
    const dayBtn = within(within(dialog).getByRole("grid", { name: "Calendar dates" })).getAllByRole("button")[15];
    await user.click(dayBtn);

    // Calendar closes and date input is updated
    expect(within(dialog).queryByRole("grid", { name: "Calendar dates" })).not.toBeInTheDocument();
  });

  it("opens custom in-app category selection panel and selects category from Kakeibo groups without system dropdowns", async () => {
    const user = userEvent.setup();
    renderInShell(<Harness />);
    await user.click((await screen.findAllByRole("button", { name: "Add transaction" }))[0]);
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: /Add expense/ }));
    const dialog = await screen.findByRole("dialog", { name: "Record an expense" });

    // Click Category trigger button
    const categoryTrigger = dialog.querySelector("#category-trigger") as HTMLButtonElement;
    expect(categoryTrigger).toBeInTheDocument();
    await user.click(categoryTrigger);

    // Verify in-app panel opened with Kakeibo groups
    const panel = within(dialog).getByRole("region", { name: "Category selection panel" });
    expect(panel).toBeInTheDocument();
    expect(within(panel).getByText("Needs")).toBeInTheDocument();
    expect(within(panel).getByText("Wants")).toBeInTheDocument();

    // Select "Groceries" tile inside the panel
    const groceriesBtn = within(panel).getByRole("button", { name: /Groceries/ });
    await user.click(groceriesBtn);

    // Panel closes and category trigger shows Groceries
    expect(within(dialog).queryByRole("region", { name: "Category selection panel" })).not.toBeInTheDocument();
    expect(categoryTrigger).toHaveTextContent("Groceries");

    // Accessible select is updated as well
    const select = within(dialog).getByLabelText(/^Category/);
    expect(select).toHaveValue("cat-1");
  });

  it("opens custom in-app payment method panel and selects method", async () => {
    const user = userEvent.setup();
    renderInShell(<Harness />);
    await user.click((await screen.findAllByRole("button", { name: "Add transaction" }))[0]);
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: /Add expense/ }));
    const dialog = await screen.findByRole("dialog", { name: "Record an expense" });

    // Click Payment method trigger
    const paymentTrigger = dialog.querySelector("#payment-method-trigger") as HTMLButtonElement;
    expect(paymentTrigger).toBeInTheDocument();
    await user.click(paymentTrigger);

    // Verify in-app panel opened
    const panel = within(dialog).getByRole("region", { name: "Payment method selection panel" });
    expect(panel).toBeInTheDocument();

    // Click "Credit card" option
    await user.click(within(panel).getByRole("button", { name: "Credit card" }));

    // Panel closes and trigger displays Credit card
    expect(within(dialog).queryByRole("region", { name: "Payment method selection panel" })).not.toBeInTheDocument();
    expect(paymentTrigger).toHaveTextContent("Credit card");

    // Accessible select is updated
    const select = within(dialog).getByLabelText(/^Payment method/);
    expect(select).toHaveValue("CREDIT_CARD");
  });

  it("opens custom in-app income source panel and selects income source", async () => {
    const user = userEvent.setup();
    renderInShell(<Harness />);
    await user.click((await screen.findAllByRole("button", { name: "Add transaction" }))[0]);
    await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: /Add income/ }));
    const dialog = await screen.findByRole("dialog", { name: "Record income" });

    // Click Income source trigger
    const sourceTrigger = dialog.querySelector("#income-source-trigger") as HTMLButtonElement;
    expect(sourceTrigger).toBeInTheDocument();
    await user.click(sourceTrigger);

    // Verify in-app panel opened
    const panel = within(dialog).getByRole("region", { name: "Income source selection panel" });
    expect(panel).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: "No income source" })).toBeInTheDocument();

    // Click "Salary"
    await user.click(within(panel).getByRole("button", { name: /Salary/ }));

    // Panel closes and trigger displays Salary
    expect(within(dialog).queryByRole("region", { name: "Income source selection panel" })).not.toBeInTheDocument();
    expect(sourceTrigger).toHaveTextContent("Salary");

    // Accessible select is updated
    const select = within(dialog).getByLabelText(/^Income source/);
    expect(select).toHaveValue("src-1");
  });
});

describe("viewing, editing and deleting (TXN-004..006)", () => {
  beforeEach(() => {
    seed(backend, {
      id: "tx-1",
      type: "EXPENSE",
      amount: "1500.00",
      category: { id: "cat-1", name: "Groceries", group: "NEEDS" },
      description: "Market",
      paymentMethod: "CASH",
    });
  });

  it("opens the details and saves only the changed fields", async () => {
    const user = userEvent.setup();
    renderInShell(<Harness />);
    await user.click(await screen.findByRole("button", { name: /Market, expense of LKR 1,500\.00/ }));
    const details = await screen.findByRole("dialog", { name: "Transaction details" });
    expect(within(details).getByText("Groceries")).toBeInTheDocument();
    await user.click(within(details).getByRole("button", { name: "Edit transaction" }));

    const form = await screen.findByRole("dialog", { name: "Edit transaction" });
    const amount = within(form).getByLabelText(/^Amount/);
    await user.clear(amount);
    await user.type(amount, "1800");
    await user.clear(within(form).getByLabelText(/^Description/));
    await user.click(within(form).getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Transaction updated");
    const [patch] = backend.callsTo("/api/v1/transactions/tx-1").filter((c) => c.method === "PATCH");
    expect(patch.body).toEqual({ amount: "1800.00", description: null });
  });

  it("deletes only after confirmation", async () => {
    const user = userEvent.setup();
    renderInShell(<Harness />);
    await user.click(await screen.findByRole("button", { name: /Market, expense/ }));
    await user.click(within(await screen.findByRole("dialog", { name: "Transaction details" })).getByRole("button", { name: "Delete" }));

    const confirm = await screen.findByRole("dialog", { name: "Delete this expense?" });
    expect(backend.state.transactions.has("tx-1")).toBe(true);
    await user.click(within(confirm).getByRole("button", { name: "Delete expense" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Transaction deleted");
    expect(backend.state.transactions.has("tx-1")).toBe(false);
    await waitFor(() => expect(screen.queryByRole("button", { name: /Market, expense/ })).not.toBeInTheDocument());
  });

  it("does not claim a deletion when the record was already gone", async () => {
    const user = userEvent.setup();
    renderInShell(<Harness />);
    await user.click(await screen.findByRole("button", { name: /Market, expense/ }));
    await user.click(within(await screen.findByRole("dialog", { name: "Transaction details" })).getByRole("button", { name: "Delete" }));
    backend.state.transactions.delete("tx-1");
    await user.click(within(await screen.findByRole("dialog", { name: "Delete this expense?" })).getByRole("button", { name: "Delete expense" }));

    expect(await screen.findByRole("status")).toHaveTextContent("no longer exists");
  });
});

describe("transaction history (TXN-003)", () => {
  beforeEach(() => {
    seed(backend, { id: "tx-a", type: "EXPENSE", amount: "100.00", category: { id: "cat-1", name: "Groceries", group: "NEEDS" }, description: "Rice" });
    seed(backend, { id: "tx-b", type: "EXPENSE", amount: "200.00", category: { id: "cat-3", name: "Entertainment", group: "WANTS" }, description: "Cinema" });
    seed(backend, { id: "tx-c", type: "INCOME", amount: "5000.00", incomeSource: { id: "src-1", name: "Monthly Salary" } });
  });

  it("sends filters to the API and shows only the matching records", async () => {
    const user = userEvent.setup();
    renderInShell(<Harness />);
    await screen.findByRole("button", { name: /Rice, expense/ });
    await waitFor(() => expect(screen.getByRole("option", { name: "Entertainment · Wants" })).toBeInTheDocument());
    await user.selectOptions(screen.getByLabelText("Filter by category"), "cat-3");

    await waitFor(() => expect(screen.queryByRole("button", { name: /Rice, expense/ })).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: /Cinema, expense/ })).toBeInTheDocument();
    const last = backend.callsTo("/api/v1/transactions").at(-1)!;
    expect(last.url).toContain("categoryId=cat-3");
    expect(last.url).toContain("type=EXPENSE");
  });

  it("shows a filtered empty state with a working clear action", async () => {
    const user = userEvent.setup();
    backend.state.transactions.delete("tx-c");
    renderInShell(<Harness />);
    await screen.findByRole("button", { name: /Rice, expense/ });
    await user.click(screen.getByRole("button", { name: "Income" }));

    expect(await screen.findByText("No transactions match these filters")).toBeInTheDocument();
    const empty = screen.getByText("No transactions match these filters").closest(".empty-state") as HTMLElement;
    await user.click(within(empty).getByRole("button", { name: "Clear filters" }));
    expect(await screen.findByRole("button", { name: /Rice, expense/ })).toBeInTheDocument();
  });

  it("shows an error with retry, never stale records, when loading fails", async () => {
    const user = userEvent.setup();
    backend.fetchMock.mockImplementationOnce(async () => {
      throw new TypeError("Failed to fetch");
    });
    renderInShell(<Harness />);
    // The first request may be /me; keep failing list requests until the error shows.
    const original = backend.fetchMock.getMockImplementation()!;
    backend.fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).includes("/api/v1/transactions")) throw new TypeError("Failed to fetch");
      return original(input, init);
    });
    const alert = await screen.findByText(/couldn't reach Divido/);
    expect(screen.queryByRole("button", { name: /Rice, expense/ })).not.toBeInTheDocument();

    backend.fetchMock.mockImplementation(original);
    await user.click(within(alert.closest(".app-error") as HTMLElement).getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("button", { name: /Rice, expense/ })).toBeInTheDocument();
  });
});

describe("buildTransactionPatch", () => {
  const expense: Transaction = {
    id: "tx-1",
    type: "EXPENSE",
    amount: "1500.00",
    date: "2026-10-10",
    category: { id: "cat-1", name: "Groceries", group: "NEEDS" },
    description: "Old description",
    paymentMethod: "CASH",
    createdAt: "2026-10-10T08:00:00Z",
    updatedAt: "2026-10-10T08:00:00Z",
  };
  const unchanged = {
    amount: "1500.00",
    date: "2026-10-10",
    description: "Old description",
    categoryId: "cat-1",
    incomeSourceId: "",
    paymentMethod: "CASH",
  };

  it("sends nothing when nothing changed", () => {
    expect(buildTransactionPatch(expense, unchanged)).toEqual({});
  });

  it("sends null to clear optional fields instead of omitting them", () => {
    expect(buildTransactionPatch(expense, { ...unchanged, description: "", paymentMethod: "" })).toEqual({
      description: null,
      paymentMethod: null,
    });
  });

  it("does not resend an unchanged (possibly inactive) category", () => {
    expect(buildTransactionPatch(expense, { ...unchanged, amount: "1800.00" })).toEqual({ amount: "1800.00" });
  });

  it("clears an income source with null (DEC-003)", () => {
    const income: Transaction = { ...expense, type: "INCOME", category: null, paymentMethod: null, incomeSource: { id: "src-1", name: "Salary" } };
    expect(
      buildTransactionPatch(income, { ...unchanged, categoryId: "", paymentMethod: "", incomeSourceId: "" }),
    ).toEqual({ incomeSourceId: null });
  });
});

describe("clearing all transactions", () => {
  it("opens confirmation dialog and clears all transactions on confirm", async () => {
    const user = userEvent.setup();
    seed(backend, { id: "tx-1", type: "EXPENSE", amount: "5000.00" });
    seed(backend, { id: "tx-2", type: "INCOME", amount: "25000.00" });

    renderInShell(<Harness />);

    const clearBtn = await screen.findByRole("button", { name: "Clear all transactions" });
    await user.click(clearBtn);

    const dialog = await screen.findByRole("dialog", { name: "Clear all transactions?" });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/This will permanently delete all your recorded transactions/)).toBeInTheDocument();

    const confirmBtn = within(dialog).getByRole("button", { name: "Clear all transactions" });
    await user.click(confirmBtn);

    await waitFor(() => {
      const deleteCalls = backend.callsTo("/api/v1/transactions").filter((c) => c.method === "DELETE");
      expect(deleteCalls).toHaveLength(1);
    });

    expect(backend.state.transactions.size).toBe(0);
  });

  it("can cancel the clear confirmation dialog without deleting", async () => {
    const user = userEvent.setup();
    seed(backend, { id: "tx-1", type: "EXPENSE", amount: "5000.00" });

    renderInShell(<Harness />);

    const clearBtn = await screen.findByRole("button", { name: "Clear all transactions" });
    await user.click(clearBtn);

    const dialog = await screen.findByRole("dialog", { name: "Clear all transactions?" });
    const cancelBtn = within(dialog).getByRole("button", { name: "Cancel" });
    await user.click(cancelBtn);

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Clear all transactions?" })).not.toBeInTheDocument();
    });

    const deleteCalls = backend.callsTo("/api/v1/transactions").filter((c) => c.method === "DELETE");
    expect(deleteCalls).toHaveLength(0);
    expect(backend.state.transactions.size).toBe(1);
  });
});

