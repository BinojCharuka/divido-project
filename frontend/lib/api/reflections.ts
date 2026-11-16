import { ApiError, apiRequest } from "@/lib/api/client";
import type { Reflection, ReflectionInput, ReflectionSummary } from "@/types/reflection";

export type { Reflection, ReflectionInput, ReflectionSummary } from "@/types/reflection";

/**
 * REFLECTION-001. Resolves to null only when the server says nothing is saved for
 * the month (404 REFLECTION_NOT_FOUND); every other failure is thrown.
 */
export async function getReflection(month: string): Promise<Reflection | null> {
  try {
    return await apiRequest<Reflection>(`/api/v1/reflections/${encodeURIComponent(month)}`, { method: "GET" });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404 && error.code === "REFLECTION_NOT_FOUND") return null;
    throw error;
  }
}

/** REFLECTION-002. First save without `version`; edits send the version last read. */
export async function saveReflection(month: string, input: ReflectionInput): Promise<Reflection> {
  return apiRequest<Reflection>(`/api/v1/reflections/${encodeURIComponent(month)}`, { method: "PUT", body: input });
}

/** REFLECTION-003. Months with a reflection, newest first, without answer text. */
export async function listReflections(): Promise<ReflectionSummary[]> {
  const body = await apiRequest<{ items: ReflectionSummary[] }>("/api/v1/reflections", { method: "GET" });
  return body.items;
}

/** REFLECTION-004. Permanent delete. */
export async function deleteReflection(month: string): Promise<void> {
  await apiRequest<void>(`/api/v1/reflections/${encodeURIComponent(month)}`, { method: "DELETE" });
}
