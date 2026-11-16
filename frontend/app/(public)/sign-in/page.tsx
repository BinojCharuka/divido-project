import { SignInScreen } from "@/features/auth/SignInScreen";

// The session check runs in the browser, so there is no instant shell to validate.
export const instant = false;

export default function SignInPage() {
  return <SignInScreen />;
}
