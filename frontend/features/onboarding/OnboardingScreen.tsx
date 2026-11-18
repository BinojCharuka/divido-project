"use client";

import { SessionGate } from "@/components/auth/SessionGate";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { OnboardingFlow } from "./OnboardingFlow";

export function OnboardingScreen() {
  return (
    <AuthLayout title="Let's set up your month" subtitle="Two minutes, and every step can wait.">
      <SessionGate require="signed-in" redirectTo="/sign-in">
        <OnboardingFlow />
      </SessionGate>
    </AuthLayout>
  );
}
