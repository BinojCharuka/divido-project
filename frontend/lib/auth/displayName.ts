/** The name shown in the app: the profile's display name (DEC-043), else the email's first part. */
export function displayNameFor(user: { displayName?: string | null; email: string } | null | undefined): string {
  if (!user) return "";
  const name = user.displayName?.trim();
  return name || user.email.split("@")[0];
}
