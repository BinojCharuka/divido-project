import type { ReactNode } from "react";
import { SessionBoundary } from "@/components/auth/SessionBoundary";
import { AppShell } from "@/components/layout/AppShell";

// Segment config must live in a Server Component. These pages read the session and
// the URL on the client, so they opt out of instant-navigation validation.
export const instant = false;

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SessionBoundary>
      <AppShell>{children}</AppShell>
    </SessionBoundary>
  );
}
