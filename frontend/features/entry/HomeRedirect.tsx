"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DividoLoadingScreen } from "@/components/ui/DividoLoadingScreen";
import { useAuth } from "@/lib/auth/AuthProvider";
import { homeFor } from "@/lib/navigation";

/** Entry point: signed-in users go to onboarding or the dashboard, everyone else to sign-in. */
export function HomeRedirect() {
  const router = useRouter();
  const { status, user } = useAuth();

  useEffect(() => {
    if (status === "signed-in") router.replace(homeFor(user));
    if (status === "signed-out" || status === "unavailable") router.replace("/sign-in");
  }, [status, user, router]);

  return <DividoLoadingScreen message="Opening Divido…" />;
}
