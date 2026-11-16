import { DashboardRoute } from "@/features/dashboard/DashboardRoute";

// Client-rendered behind the session check, so there is no instant shell to validate.
export const instant = false;

export default function Page() {
  return <DashboardRoute />;
}
