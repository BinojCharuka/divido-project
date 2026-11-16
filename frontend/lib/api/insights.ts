import { apiRequest } from "@/lib/api/client";
import type { Insights } from "@/types/insights";

export type { Insights, Observation } from "@/types/insights";

/** INSIGHT-001. Every figure and observation is calculated by the backend. */
export async function getInsights(month: string): Promise<Insights> {
  return apiRequest<Insights>(`/api/v1/insights?month=${encodeURIComponent(month)}`, { method: "GET" });
}
