import { apiRequest } from "@/lib/api/client";

export interface ProfileResponse {
  id: string;
  email: string;
  displayName: string;
  locale: string;
  currency: string;
  timeZone: string;
  onboardingComplete: boolean;
}

export interface ProfileUpdateRequest {
  displayName?: string;
  locale?: string;
  currency?: string;
  timeZone?: string;
  onboardingComplete?: boolean;
}

export async function getProfile(): Promise<ProfileResponse> {
  return apiRequest<ProfileResponse>("/api/v1/profile", { method: "GET" });
}

export async function updateProfile(input: ProfileUpdateRequest): Promise<ProfileResponse> {
  return apiRequest<ProfileResponse>("/api/v1/profile", {
    method: "PATCH",
    body: input,
  });
}

export async function completeOnboarding(): Promise<ProfileResponse> {
  return apiRequest<ProfileResponse>("/api/v1/profile/onboarding-complete", {
    method: "POST",
  });
}
