import { ForgotPasswordScreen } from "@/features/auth/ForgotPasswordScreen";

// The session check runs in the browser, so there is no instant shell to validate.
export const instant = false;

export default function ForgotPasswordPage() {
  return <ForgotPasswordScreen />;
}
