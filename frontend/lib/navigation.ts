/**
 * A full page load. Used when the session ends: with cacheComponents, Next.js keeps
 * recently visited routes mounted but hidden, so a client-side navigation would keep
 * the previous user's data in memory and in the DOM. A reload discards all of it.
 */
export function reloadTo(path: string): void {
  window.location.assign(path);
}

/** Query values for /sign-in that explain why the user is there. */
export type SignInNotice = "registered" | "signed-out" | "session-ended" | "password-reset" | "account-deleted";

export const SIGN_IN_NOTICES: readonly SignInNotice[] = [
  "registered",
  "signed-out",
  "session-ended",
  "password-reset",
  "account-deleted",
];

/** Where a signed-in user starts: onboarding until it is finished or skipped (DEC-044). */
export function homeFor(user: { onboardingComplete: boolean } | null): string {
  return user && !user.onboardingComplete ? "/onboarding" : "/dashboard";
}

export function signInPath(notice: SignInNotice): string {
  return `/sign-in?notice=${notice}`;
}
