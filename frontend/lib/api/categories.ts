import { apiRequest } from "@/lib/api/client";
import type { CategoriesResponse, Category } from "@/types/category";

/**
 * Categories API client module implementing docs/05-api/categories-api.md.
 */

export async function listCategories(includeInactive?: boolean): Promise<Category[]> {
  const params = new URLSearchParams();
  if (includeInactive) params.set("includeInactive", "true");
  const query = params.toString();
  const path = `/api/v1/categories${query ? `?${query}` : ""}`;
  const response = await apiRequest<CategoriesResponse>(path, { method: "GET" });
  return response.items;
}
