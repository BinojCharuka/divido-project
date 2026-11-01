import { apiRequest } from "@/lib/api/client";

export interface ReflectionAnswer {
  questionId: string;
  answer: string;
}

export interface ReflectionResponse {
  month: string;
  answers: ReflectionAnswer[];
  updatedAt: string;
}

export interface ReflectionInput {
  answers: ReflectionAnswer[];
}

export async function getReflection(month: string): Promise<ReflectionResponse> {
  return apiRequest<ReflectionResponse>(`/api/v1/reflections/${encodeURIComponent(month)}`, {
    method: "GET",
  });
}

export async function saveReflection(month: string, input: ReflectionInput): Promise<ReflectionResponse> {
  return apiRequest<ReflectionResponse>(`/api/v1/reflections/${encodeURIComponent(month)}`, {
    method: "PUT",
    body: input,
  });
}
