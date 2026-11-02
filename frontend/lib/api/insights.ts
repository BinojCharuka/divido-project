import { apiRequest } from "@/lib/api/client";

export interface InsightItem {
  id: string;
  type: string;
  title: string;
  description: string;
  group?: "NEEDS" | "WANTS" | "CULTURE" | "UNEXPECTED" | null;
  evidence?: Record<string, any>;
}

export interface InsightsResponse {
  from: string;
  to: string;
  items: InsightItem[];
  insufficientHistory: boolean;
}

export async function getInsights(params: { from?: string; to?: string } = {}): Promise<InsightsResponse> {
  const q = new URLSearchParams();
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  const query = q.toString();
  return apiRequest<InsightsResponse>(`/api/v1/insights${query ? `?${query}` : ""}`, {
    method: "GET",
  });
}
