import { ApiError, apiRequest, clearCsrfToken } from "@/lib/api/client";

/** The `user` object returned by register, sign-in and /me (authentication-api.md). */
export type User = {
  id: string;
  email: string;
  displayName: string;
  onboardingComplete: boolean;
};

type UserResponse = { user: User };

export type RegisterInput = { email: string; password: string; displayName: string };
export type SignInInput = { email: string; password: string };

/** AUTH-003. Resolves to null when there is no valid session. */
export async function fetchCurrentUser(): Promise<User | null> {
  try {
    return (await apiRequest<UserResponse>("/api/v1/auth/me", { quietUnauthenticated: true })).user;
  } catch (error) {
    if (error instanceof ApiError && error.kind === "unauthenticated") return null;
    throw error;
  }
}

/** AUTH-001. Creates the account only; the user is not signed in (DEC-025). */
export async function register(input: RegisterInput): Promise<User> {
  return (await apiRequest<UserResponse>("/api/v1/auth/register", { method: "POST", body: input })).user;
}

/** AUTH-002. The server replaces the CSRF token on success, so the cached one is dropped. */
export async function signIn(input: SignInInput): Promise<User> {
  const { user } = await apiRequest<UserResponse>("/api/v1/auth/login", {
    method: "POST",
    body: input,
    quietUnauthenticated: true,
  });
  clearCsrfToken();
  return user;
}

/** AUTH-004. The server clears the CSRF cookie too, so the cached token is dropped. */
export async function signOut(): Promise<void> {
  try {
    await apiRequest<void>("/api/v1/auth/logout", { method: "POST", quietUnauthenticated: true });
  } finally {
    clearCsrfToken();
  }
}

/**
 * AUTH-007 (DEC-045). The reply is the same whether or not the email has an account,
 * so this resolves for any well-formed email; only transport or rate-limit errors throw.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  await apiRequest<void>("/api/v1/auth/password-reset/request", {
    method: "POST",
    body: { email },
    quietUnauthenticated: true,
  });
}

/** AUTH-008. Sets the new password; every session of the account ends. */
export async function confirmPasswordReset(token: string, newPassword: string): Promise<void> {
  try {
    await apiRequest<void>("/api/v1/auth/password-reset/confirm", {
      method: "POST",
      body: { token, newPassword },
      quietUnauthenticated: true,
    });
  } finally {
    // The account's sessions ended on the server, this browser's included.
    clearCsrfToken();
  }
}
