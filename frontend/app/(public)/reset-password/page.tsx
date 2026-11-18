import { ResetPasswordScreen } from "@/features/auth/ResetPasswordScreen";

// The token is read from the URL fragment in the browser, so there is no instant shell to validate.
export const instant = false;

export default function ResetPasswordPage() {
  return <ResetPasswordScreen />;
}
