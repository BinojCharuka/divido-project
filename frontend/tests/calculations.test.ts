import { describe, expect, it } from "vitest";

describe("Divido Financial & Kakeibo Calculations (BR-017, BR-018, BR-019, BR-020)", () => {
  type Group = "Needs" | "Wants" | "Culture" | "Unexpected";
  interface Transaction {
    id: string | number;
    amount: number;
    group: Group | "Income";
    date: string;
  }

  const computeBudgetMetrics = (
    transactions: Transaction[],
    plannedIncome: number,
    savingsTarget: number,
    plans: Record<Group, number>,
    selectedMonth: number,
  ) => {
    const monthTransactions = transactions.filter(
      (t) => new Date(`${t.date}T12:00:00`).getMonth() === selectedMonth,
    );
    const spent = monthTransactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const income = monthTransactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    const groupSpent = (group: Group) =>
      monthTransactions
        .filter((t) => t.group === group && t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const totalAllocated = Object.values(plans).reduce((a, b) => a + b, 0);
    const available = Math.max(0, plannedIncome - savingsTarget);
    const budgetBase = available > 0 ? available : totalAllocated;
    const remaining = budgetBase - spent;
    const spendingPercent =
      budgetBase > 0 ? Math.round((spent / budgetBase) * 100) : spent > 0 ? 100 : 0;
    const unallocated = plannedIncome - savingsTarget - totalAllocated;

    return {
      monthTransactions,
      spent,
      income,
      groupSpent,
      totalAllocated,
      available,
      budgetBase,
      remaining,
      spendingPercent,
      unallocated,
    };
  };

  it("calculates clean slate with 0 transactions and 0 budget without phantom offsets", () => {
    const metrics = computeBudgetMetrics([], 0, 0, { Needs: 0, Wants: 0, Culture: 0, Unexpected: 0 }, 10);
    expect(metrics.spent).toBe(0);
    expect(metrics.income).toBe(0);
    expect(metrics.available).toBe(0);
    expect(metrics.remaining).toBe(0);
    expect(metrics.spendingPercent).toBe(0);
    expect(metrics.unallocated).toBe(0);
    expect(metrics.groupSpent("Needs")).toBe(0);
  });

  it("calculates recorded income dynamically when income transactions are added", () => {
    const txs: Transaction[] = [
      { id: 1, amount: 150000, group: "Income", date: "2026-11-02" },
      { id: 2, amount: 25000, group: "Income", date: "2026-11-05" },
    ];
    const metrics = computeBudgetMetrics(txs, 200000, 30000, { Needs: 80000, Wants: 40000, Culture: 30000, Unexpected: 20000 }, 10);
    expect(metrics.income).toBe(175000);
    expect(metrics.spent).toBe(0);
    expect(metrics.available).toBe(170000); // 200,000 - 30,000
    expect(metrics.remaining).toBe(170000);
    expect(metrics.unallocated).toBe(0); // 170000 - 170000
  });

  it("calculates spent and remaining budget correctly when expenses are recorded", () => {
    const txs: Transaction[] = [
      { id: 1, amount: -15000, group: "Needs", date: "2026-11-02" },
      { id: 2, amount: -8500, group: "Wants", date: "2026-11-03" },
      { id: 3, amount: -4200, group: "Culture", date: "2026-11-04" },
    ];
    const plans: Record<Group, number> = {
      Needs: 50000,
      Wants: 20000,
      Culture: 10000,
      Unexpected: 10000,
    };
    const metrics = computeBudgetMetrics(txs, 100000, 10000, plans, 10);

    expect(metrics.spent).toBe(27700); // 15000 + 8500 + 4200
    expect(metrics.available).toBe(90000); // 100000 - 10000
    expect(metrics.remaining).toBe(62300); // 90000 - 27700
    expect(metrics.spendingPercent).toBe(31); // 27700 / 90000 = 30.77% -> 31%
    expect(metrics.groupSpent("Needs")).toBe(15000);
    expect(metrics.groupSpent("Wants")).toBe(8500);
    expect(metrics.groupSpent("Culture")).toBe(4200);
    expect(metrics.groupSpent("Unexpected")).toBe(0);
  });

  it("handles over-budget scenarios gracefully with negative remaining and over plan flags", () => {
    const txs: Transaction[] = [
      { id: 1, amount: -65000, group: "Needs", date: "2026-11-02" },
    ];
    const plans: Record<Group, number> = {
      Needs: 50000,
      Wants: 0,
      Culture: 0,
      Unexpected: 0,
    };
    const metrics = computeBudgetMetrics(txs, 50000, 0, plans, 10);

    expect(metrics.spent).toBe(65000);
    expect(metrics.remaining).toBe(-15000);
    expect(metrics.spendingPercent).toBe(130);
    expect(plans.Needs - metrics.groupSpent("Needs")).toBe(-15000);
  });

  it("accurately filters transactions by the selected month", () => {
    const txs: Transaction[] = [
      { id: 1, amount: -10000, group: "Needs", date: "2026-10-15" }, // October (month 9)
      { id: 2, amount: -25000, group: "Needs", date: "2026-11-02" }, // November (month 10)
    ];
    const plans: Record<Group, number> = {
      Needs: 50000,
      Wants: 0,
      Culture: 0,
      Unexpected: 0,
    };
    const octMetrics = computeBudgetMetrics(txs, 50000, 0, plans, 9);
    const novMetrics = computeBudgetMetrics(txs, 50000, 0, plans, 10);

    expect(octMetrics.spent).toBe(10000);
    expect(novMetrics.spent).toBe(25000);
  });
});
