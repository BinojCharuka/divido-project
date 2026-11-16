import type { KakeiboGroup } from "./category";

/**
 * Spending Insights model matching docs/05-api/insights-api.md (DIV-027; DEC-031,
 * DEC-032, DEC-033, DEC-041). Amounts are exact decimal strings with two places;
 * percentages have one decimal place and are null when their base is zero.
 */

export interface InsightGroup {
  group: KakeiboGroup;
  spent: string;
  /** Share of the month's total spending; null when nothing was spent. */
  sharePercent: string | null;
  expenseCount: number;
}

export interface InsightGroupChange {
  group: KakeiboGroup;
  currentSpent: string;
  previousSpent: string;
  changePercent: string | null;
}

export interface InsightComparison {
  currentStart: string;
  currentEnd: string;
  previousStart: string;
  previousEnd: string;
  currentSpent: string;
  previousSpent: string;
  changePercent: string | null;
  currentSpendingDays: number;
  previousSpendingDays: number;
  groups: InsightGroupChange[];
}

export interface InsightTrendMonth {
  month: string;
  /** Null before the user's first transaction: no activity, not zero. */
  totalSpent: string | null;
  hasActivity: boolean;
  /** The selected month while it is still in progress. */
  partial: boolean;
}

export type Observation =
  | { type: "LARGEST_GROUP"; group: KakeiboGroup; spent: string; sharePercent: string; spendingDays: number }
  | { type: "GROUP_OVER_PLAN"; group: KakeiboGroup; budget: string; spent: string; overBy: string }
  | { type: "MONTH_CHANGE"; currentSpent: string; previousSpent: string; changePercent: string | null }
  | {
      type: "REPEATED_CATEGORY";
      categoryId: string;
      categoryName: string;
      group: KakeiboGroup;
      distinctDays: number;
      transactionCount: number;
      dates: string[];
    };

export interface Insights {
  month: string;
  periodStart: string;
  periodEnd: string;
  /** The earlier of today and the month's last day. */
  asOf: string;
  partialMonth: boolean;
  minimumSpendingDays: number;
  spendingDays: number;
  insufficientHistory: boolean;
  totalSpent: string;
  groups: InsightGroup[];
  comparison: InsightComparison;
  trend: InsightTrendMonth[];
  lookbackStart: string;
  lookbackEnd: string;
  observations: Observation[];
}
