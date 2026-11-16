/** The name shown in the app. The API has no display name yet (DIV-022), so it comes from the email. */
export function displayNameFor(email: string | undefined | null): string {
  return email ? email.split("@")[0] : "";
}
