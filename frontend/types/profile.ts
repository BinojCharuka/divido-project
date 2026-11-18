/** The signed-in user's profile, matching docs/05-api/profile-api.md (DIV-022, DEC-043). */
export interface Profile {
  id: string;
  email: string;
  displayName: string;
  /** Fixed for the MVP: LKR. */
  currency: string;
  /** Fixed for the MVP: Asia/Colombo. */
  timeZone: string;
  /** Fixed for the MVP: en. */
  locale: string;
  onboardingComplete: boolean;
}
