import { apiRequest } from "@/lib/api/client";
import type { IncomeSource, IncomeSourcesResponse } from "@/types/income-source";

/**
 * Income Sources API client module implementing docs/05-api/income-sources-api.md.
 */

export async function listIncomeSources(includeInactive?: boolean): Promise<IncomeSource[]> {
  const params = new URLSearchParams();
  if (includeInactive) params.set("includeInactive", "true");
  const query = params.toString();
  const path = `/api/v1/income-sources${query ? `?${query}` : ""}`;
  const response = await apiRequest<IncomeSourcesResponse>(path, { method: "GET" });
  return response.items;
}
