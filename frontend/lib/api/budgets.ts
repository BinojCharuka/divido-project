import { ApiError, apiRequest } from "@/lib/api/client";
import type { MonthlyBudget, MonthlyBudgetInput } from "@/types/budget";

export type { MonthlyBudget, MonthlyBudgetInput } from "@/types/budget";

/**
 * BUDGET-001. Resolves to null only when the server says no plan exists for the
 * month (404 BUDGET_NOT_FOUND); every other failure is thrown as an ApiError.
 */
export async function getBudget(month: string): Promise<MonthlyBudget | null> {
  try {
    return await apiRequest<MonthlyBudget>(`/api/v1/budgets/${encodeURIComponent(month)}`, { method: "GET" });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404 && error.code === "BUDGET_NOT_FOUND") return null;
    throw error;
  }
}

/** BUDGET-002. Creates or replaces the month's plan and returns what was stored. */
export async function saveBudget(month: string, input: MonthlyBudgetInput): Promise<MonthlyBudget> {
  return apiRequest<MonthlyBudget>(`/api/v1/budgets/${encodeURIComponent(month)}`, {
    method: "PUT",
    body: input,
  });
}
