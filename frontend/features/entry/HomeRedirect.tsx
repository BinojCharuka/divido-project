"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DividoLoadingScreen } from "@/components/ui/DividoLoadingScreen";
import { useAuth } from "@/lib/auth/AuthProvider";

/** Entry point: signed-in users go to the dashboard, everyone else to sign-in. */
export function HomeRedirect() {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "signed-in") router.replace("/dashboard");
    if (status === "signed-out" || status === "unavailable") router.replace("/sign-in");
  }, [status, router]);

  return <DividoLoadingScreen message="Opening Divido…" />;
}
