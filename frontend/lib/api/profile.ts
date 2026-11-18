import { apiRequest, clearCsrfToken } from "@/lib/api/client";
import type { Profile } from "@/types/profile";

export type { Profile } from "@/types/profile";

/** PROFILE-001. */
export function getProfile(): Promise<Profile> {
  return apiRequest<Profile>("/api/v1/profile");
}

/** PROFILE-002. Only the display name can change (DEC-043). */
export function updateDisplayName(displayName: string): Promise<Profile> {
  return apiRequest<Profile>("/api/v1/profile", { method: "PATCH", body: { displayName } });
}

/** PROFILE-003. Finishing or skipping onboarding (DEC-044); calling it again changes nothing. */
export function completeOnboarding(): Promise<Profile> {
  return apiRequest<Profile>("/api/v1/profile/onboarding-complete", { method: "POST" });
}

/**
 * PROFILE-004. Other sessions of the account end; this one stays signed in under a
 * new session ID, so the cached CSRF token is dropped.
 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiRequest<void>("/api/v1/profile/password", { method: "POST", body: { currentPassword, newPassword } });
  clearCsrfToken();
}

/** PROFILE-005. Deletes the account and all its data at once, then signs out (DEC-046). */
export async function deleteAccount(password: string, confirmation: string): Promise<void> {
  await apiRequest<void>("/api/v1/profile", { method: "DELETE", body: { password, confirmation } });
  clearCsrfToken();
}
