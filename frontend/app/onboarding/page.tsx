"use client";

import { SessionGate } from "@/components/auth/SessionGate";
import { AuthPageShell } from "@/components/layout/AuthPageShell";
import { SignOutButton } from "@/features/auth/SignOutButton";
import { useAuth } from "@/lib/auth/AuthProvider";

/**
 * Placeholder for UX-P03. Onboarding content is not specified or built yet; this
 * page is the signed-in destination until it is.
 */
function OnboardingPlaceholder() {
  const { user } = useAuth();
  return (
    <>
      <p className="text-zinc-700 dark:text-zinc-300">
        You&apos;re signed in as <span className="font-medium text-zinc-900 dark:text-zinc-100">{user?.email}</span>.
      </p>
      <p className="text-zinc-700 dark:text-zinc-300">Account setup is coming soon.</p>
      <SignOutButton />
    </>
  );
}

export default function OnboardingPage() {
  return (
    <AuthPageShell title="Set up Divido">
      <SessionGate require="signed-in" redirectTo="/sign-in">
        <OnboardingPlaceholder />
      </SessionGate>
    </AuthPageShell>
  );
}
