import { apiRequest } from "@/lib/api/client";

export interface BudgetAllocations {
  NEEDS: string;
  WANTS: string;
  CULTURE: string;
  UNEXPECTED: string;
}

export interface MonthlyBudgetResponse {
  month: string;
  plannedIncome: string;
  savingsTarget: string;
  allocations: BudgetAllocations;
  allocationTotal: string;
  plannedTotal: string;
  overAllocationAmount: string;
}

export interface MonthlyBudgetInput {
  plannedIncome: string;
  savingsTarget: string;
  allocations: BudgetAllocations;
}

export async function getBudget(month: string): Promise<MonthlyBudgetResponse> {
  return apiRequest<MonthlyBudgetResponse>(`/api/v1/budgets/${encodeURIComponent(month)}`, {
    method: "GET",
  });
}

export async function saveBudget(month: string, input: MonthlyBudgetInput): Promise<MonthlyBudgetResponse> {
  return apiRequest<MonthlyBudgetResponse>(`/api/v1/budgets/${encodeURIComponent(month)}`, {
    method: "PUT",
    body: input,
  });
}
