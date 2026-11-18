/**
 * Client-side checks that mirror the backend rules in authentication-api.md, so
 * most mistakes are caught before a request. The backend stays authoritative.
 */

export type FieldErrors = Partial<Record<string, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+$/;

function checkEmail(email: string): string | undefined {
  const value = email.trim();
  if (!value) return "Enter your email address.";
  if (value.length > 255 || !EMAIL.test(value)) return "Enter a valid email address.";
  return undefined;
}

export function validateSignIn(input: { email: string; password: string }): FieldErrors {
  const errors: FieldErrors = {};
  errors.email = checkEmail(input.email);
  if (!input.password) errors.password = "Enter your password.";
  return clean(errors);
}

export function validateSignUp(input: { email: string; password: string; displayName: string }): FieldErrors {
  const errors: FieldErrors = {};
  const name = input.displayName.trim();
  if (!name) errors.displayName = "Enter your name.";
  else if (name.length > 100) errors.displayName = "Use 100 characters or fewer.";
  errors.email = checkEmail(input.email);
  if (!input.password) errors.password = "Enter a password.";
  else if (input.password.length < 8) errors.password = "Use at least 8 characters.";
  else if (new TextEncoder().encode(input.password).length > 72) errors.password = "Use a shorter password.";
  return clean(errors);
}

function clean(errors: FieldErrors): FieldErrors {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message)) as FieldErrors;
}

export function validateDisplayName(displayName: string): string | undefined {
  const name = displayName.trim();
  if (!name) return "Enter your name.";
  if (name.length > 100) return "Use 100 characters or fewer.";
  return undefined;
}

/** A new password and its confirmation, with the same rules as sign-up. */
export function validateNewPassword(password: string, confirmation: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!password) errors.newPassword = "Enter a new password.";
  else if (password.length < 8) errors.newPassword = "Use at least 8 characters.";
  else if (new TextEncoder().encode(password).length > 72) errors.newPassword = "Use a shorter password.";
  if (!errors.newPassword && password !== confirmation) errors.confirmPassword = "The passwords don't match.";
  return clean(errors);
}

export function validateEmail(email: string): string | undefined {
  return checkEmail(email);
}
