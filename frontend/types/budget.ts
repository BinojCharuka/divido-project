import type { KakeiboGroup } from "./category";

/**
 * Monthly budget and dashboard models matching docs/05-api/budgets-api.md,
 * docs/05-api/dashboard-api.md and docs/05-api/openapi.yaml (DIV-017).
 * Every amount is an exact decimal string with two places, e.g. "40000.00".
 */

export type BudgetAllocations = Record<KakeiboGroup, string>;

export interface MonthlyBudget {
  month: string; // YYYY-MM
  plannedIncome: string;
  savingsTarget: string;
  allocations: BudgetAllocations;
  allocationTotal: string;
  plannedTotal: string;
  /** plannedTotal − plannedIncome. Positive: over-allocated; zero or negative: fits. */
  overAllocationAmount: string;
  overAllocated: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyBudgetInput {
  plannedIncome: string;
  savingsTarget: string;
  allocations: BudgetAllocations;
}

export interface DashboardGroup {
  group: KakeiboGroup;
  /** Planned allocation; null without a budget. */
  budget: string | null;
  /** Recorded expenses in this group for the month; "0.00" when none. */
  spent: string;
  /** budget − spent, may be negative; null without a budget. */
  remaining: string | null;
  /** spent ÷ budget × 100 (one decimal); null without a budget or when the budget is zero. */
  percentUsed: string | null;
  overBudget: boolean | null;
  expenseCount: number;
}

export interface Dashboard {
  month: string;
  periodStart: string;
  periodEnd: string;
  hasBudget: boolean;
  plannedIncome: string | null;
  savingsTarget: string | null;
  allocationTotal: string | null;
  plannedTotal: string | null;
  overAllocationAmount: string | null;
  overAllocated: boolean | null;
  recordedIncome: string;
  incomeTransactionCount: number;
  totalSpent: string;
  expenseTransactionCount: number;
  groups: DashboardGroup[];
}
