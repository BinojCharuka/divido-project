import { apiRequest } from "@/lib/api/client";
import type { IncomeSource, IncomeSourcesResponse } from "@/types/income-source";

/**
 * Income Sources API client module implementing docs/05-api/income-sources-api.md.
 */

export interface CreateIncomeSourceInput {
  name: string;
}

export interface UpdateIncomeSourceInput {
  name: string;
}

export async function listIncomeSources(opts?: boolean | { includeInactive?: boolean }): Promise<IncomeSource[]> {
  const includeInactive = typeof opts === "boolean" ? opts : opts?.includeInactive;
  const params = new URLSearchParams();
  if (includeInactive) params.set("includeInactive", "true");
  const query = params.toString();
  const path = `/api/v1/income-sources${query ? `?${query}` : ""}`;
  const response = await apiRequest<IncomeSourcesResponse>(path, { method: "GET" });
  return response.items;
}

export async function createIncomeSource(input: CreateIncomeSourceInput): Promise<IncomeSource> {
  return apiRequest<IncomeSource>("/api/v1/income-sources", {
    method: "POST",
    body: input,
  });
}

export async function updateIncomeSource(id: string, input: UpdateIncomeSourceInput): Promise<IncomeSource> {
  return apiRequest<IncomeSource>(`/api/v1/income-sources/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: input,
  });
}

export async function deactivateIncomeSource(id: string): Promise<void> {
  return apiRequest<void>(`/api/v1/income-sources/${encodeURIComponent(id)}/deactivate`, {
    method: "POST",
  });
}
