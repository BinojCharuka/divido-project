"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { DividoLoadingScreen } from "@/components/ui/DividoLoadingScreen";
import { useAuth } from "@/lib/auth/AuthProvider";

/**
 * Renders the signed-in app only with a valid session and sends everyone else to
 * sign-in. A navigation aid only: the backend authorises every request.
 */
export function SessionBoundary({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status, refresh } = useAuth();

  useEffect(() => {
    if (status === "signed-out") router.replace("/sign-in");
  }, [status, router]);

  if (status === "unavailable") {
    return (
      <div className="auth-page">
        <div className="auth-card app-unavailable" role="alert">
          <h1>We couldn&apos;t reach Divido</h1>
          <p>Check your connection and try again.</p>
          <Button variant="primary" onClick={() => void refresh()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }
  if (status !== "signed-in") {
    return <DividoLoadingScreen message={status === "loading" ? "Checking your session…" : "Redirecting…"} />;
  }
  return <>{children}</>;
}
