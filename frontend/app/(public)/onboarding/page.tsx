import { OnboardingRedirect } from "@/features/entry/OnboardingRedirect";

// Client-rendered behind the session check, so there is no instant shell to validate.
export const instant = false;

export default function Page() {
  return <OnboardingRedirect />;
}
