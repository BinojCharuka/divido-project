import { SignUpScreen } from "@/features/auth/SignUpScreen";

// The session check runs in the browser, so there is no instant shell to validate.
export const instant = false;

export default function SignUpPage() {
  return <SignUpScreen />;
}
