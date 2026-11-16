"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { DividoLoadingScreen } from "@/components/ui/DividoLoadingScreen";

/**
 * Guided onboarding (DIV-023) is not built yet and waits for an owner decision.
 * Until then this route sends people to the dashboard, which explains how to start.
 */
export function OnboardingRedirect() {
  const router = useRouter();
  useEffect(() => router.replace("/dashboard"), [router]);
  return <DividoLoadingScreen message="Opening your dashboard…" />;
}
