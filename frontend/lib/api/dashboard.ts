import { apiRequest } from "@/lib/api/client";
import type { Transaction } from "@/types/transaction";

export interface DashboardGroupSummary {
  group: "NEEDS" | "WANTS" | "CULTURE" | "UNEXPECTED";
  budget: string;
  spent: string;
  remaining: string;
}

export interface DashboardResponse {
  month: string;
  plannedIncome: string;
  recordedIncome: string;
  savingsTarget: string;
  groups: DashboardGroupSummary[];
  recentTransactions: Transaction[];
  insightPreview: any;
}

export async function getDashboard(month?: string): Promise<DashboardResponse> {
  const query = month ? `?month=${encodeURIComponent(month)}` : "";
  return apiRequest<DashboardResponse>(`/api/v1/dashboard${query}`, {
    method: "GET",
  });
}
