import { apiRequest } from "@/lib/api/client";
import type { Dashboard } from "@/types/budget";

export type { Dashboard, DashboardGroup } from "@/types/budget";

/** DASH-001. All totals are calculated by the backend; the UI only displays them. */
export async function getDashboard(month: string): Promise<Dashboard> {
  return apiRequest<Dashboard>(`/api/v1/dashboard?month=${encodeURIComponent(month)}`, { method: "GET" });
}
