import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest, clearCsrfToken } from "@/lib/api/client";
import { updateTransaction } from "@/lib/api/transactions";
import type { Transaction } from "@/types/transaction";
import { DEFAULT_CATEGORIES, FakeCategory, installFakeBackend } from "./fakeBackend";

describe("fakeBackend categories alignment (DEC-013)", () => {
  let backend: ReturnType<typeof installFakeBackend>;

  beforeEach(() => {
    clearCsrfToken();
    backend = installFakeBackend();
    backend.state.signedInAs = "test@example.com";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns exactly the 3 approved global default categories with correct group mappings", async () => {
    const res = await apiRequest<{ items: typeof DEFAULT_CATEGORIES }>("/api/v1/categories");

    expect(res.items).toHaveLength(3);

    expect(res.items).toEqual([
      { id: "cat-1", name: "Groceries", group: "NEEDS", isDefault: true, active: true },
      { id: "cat-2", name: "Transport", group: "NEEDS", isDefault: true, active: true },
      { id: "cat-3", name: "Entertainment", group: "WANTS", isDefault: true, active: true },
    ]);

    // All must have isDefault === true
    expect(res.items.every((c) => c.isDefault === true)).toBe(true);
  });

  it("returns user-created custom categories alongside defaults without marking them default", async () => {
    backend.state.customCategories.push({
      id: "cat-custom-1",
      name: "Books & Study",
      group: "CULTURE",
      isDefault: false,
      active: true,
    });

    const res = await apiRequest<{ items: FakeCategory[] }>("/api/v1/categories");

    expect(res.items).toHaveLength(4);
    const custom = res.items.find((c) => c.id === "cat-custom-1");
    expect(custom).toEqual({
      id: "cat-custom-1",
      name: "Books & Study",
      group: "CULTURE",
      isDefault: false,
      active: true,
    });
  });
});

describe("fakeBackend PATCH transaction behavior (Task 4)", () => {
  let backend: ReturnType<typeof installFakeBackend>;

  const initialExpense: Transaction = {
    id: "tx-test-1",
    type: "EXPENSE",
    amount: "1500.00",
    date: "2026-10-15",
    category: { id: "cat-1", name: "Groceries", group: "NEEDS" },
    incomeSource: null,
    description: "Weekly fruits",
    paymentMethod: "CASH",
    createdAt: "2026-10-15T10:00:00Z",
    updatedAt: "2026-10-15T10:00:00Z",
  };

  const initialIncome: Transaction = {
    id: "tx-test-2",
    type: "INCOME",
    amount: "75000.00",
    date: "2026-10-01",
    category: null,
    incomeSource: { id: "src-1", name: "Monthly Salary" },
    description: "Main paycheck",
    paymentMethod: null,
    createdAt: "2026-10-01T08:00:00Z",
    updatedAt: "2026-10-01T08:00:00Z",
  };

  beforeEach(() => {
    clearCsrfToken();
    backend = installFakeBackend();
    backend.state.signedInAs = "test@example.com";
    backend.state.transactions.set(initialExpense.id, { ...initialExpense });
    backend.state.transactions.set(initialIncome.id, { ...initialIncome });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("updates an expense category and updates embedded display object consistently", async () => {
    const updated = await updateTransaction("tx-test-1", {
      categoryId: "cat-2",
    });

    expect(updated.category).toEqual({
      id: "cat-2",
      name: "Transport",
      group: "NEEDS",
    });
    // Omitted fields preserved
    expect(updated.amount).toBe("1500.00");
    expect(updated.date).toBe("2026-10-15");
    expect(updated.description).toBe("Weekly fruits");
    expect(updated.paymentMethod).toBe("CASH");
    expect(updated.type).toBe("EXPENSE");
  });

  it("updates an income source and updates embedded display object consistently", async () => {
    const updated = await updateTransaction("tx-test-2", {
      incomeSourceId: "src-2",
    });

    expect(updated.incomeSource).toEqual({
      id: "src-2",
      name: "Freelance",
    });
    // Omitted fields preserved
    expect(updated.amount).toBe("75000.00");
    expect(updated.date).toBe("2026-10-01");
    expect(updated.description).toBe("Main paycheck");
    expect(updated.type).toBe("INCOME");
  });

  it("updates amount and date together", async () => {
    const updated = await updateTransaction("tx-test-1", {
      amount: "2200.50",
      date: "2026-10-18",
    });

    expect(updated.amount).toBe("2200.50");
    expect(updated.date).toBe("2026-10-18");
    // Category, description, paymentMethod preserved
    expect(updated.category?.id).toBe("cat-1");
    expect(updated.description).toBe("Weekly fruits");
  });

  it("preserves all omitted fields when updating a single property", async () => {
    const updated = await updateTransaction("tx-test-1", {
      description: "Organic vegetables",
    });

    expect(updated.description).toBe("Organic vegetables");
    expect(updated.amount).toBe("1500.00");
    expect(updated.date).toBe("2026-10-15");
    expect(updated.category?.id).toBe("cat-1");
    expect(updated.paymentMethod).toBe("CASH");
    expect(updated.type).toBe("EXPENSE");
  });

  it("returns 404 error when attempting to update a non-existent transaction", async () => {
    await expect(
      updateTransaction("non-existent-id", {
        amount: "500.00",
      }),
    ).rejects.toThrow("Transaction not found.");
  });

  it("does not change transaction type even if type is passed", async () => {
    const updated = await updateTransaction("tx-test-1", {
      amount: "3000.00",
      // @ts-expect-error test illegal type override
      type: "INCOME",
    });

    expect(updated.type).toBe("EXPENSE");
  });
});
