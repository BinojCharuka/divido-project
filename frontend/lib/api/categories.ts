import { apiRequest } from "@/lib/api/client";
import type { CategoriesResponse, Category, KakeiboGroup } from "@/types/category";

/**
 * Categories API client module implementing docs/05-api/categories-api.md.
 */

export interface CreateCategoryInput {
  name: string;
  group: KakeiboGroup;
}

export interface UpdateCategoryInput {
  name?: string;
  group?: KakeiboGroup;
}

export async function listCategories(opts?: boolean | { includeInactive?: boolean }): Promise<Category[]> {
  const includeInactive = typeof opts === "boolean" ? opts : opts?.includeInactive;
  const params = new URLSearchParams();
  if (includeInactive) params.set("includeInactive", "true");
  const query = params.toString();
  const path = `/api/v1/categories${query ? `?${query}` : ""}`;
  const response = await apiRequest<CategoriesResponse>(path, { method: "GET" });
  return response.items;
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  return apiRequest<Category>("/api/v1/categories", {
    method: "POST",
    body: input,
  });
}

export async function updateCategory(id: string, input: UpdateCategoryInput): Promise<Category> {
  return apiRequest<Category>(`/api/v1/categories/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: input,
  });
}

export async function deactivateCategory(id: string): Promise<void> {
  return apiRequest<void>(`/api/v1/categories/${encodeURIComponent(id)}/deactivate`, {
    method: "POST",
  });
}
