"use client";

import Link from "next/link";
import { SessionGate } from "@/components/auth/SessionGate";
import { AuthPageShell } from "@/components/layout/AuthPageShell";
import { SignOutButton } from "@/features/auth/SignOutButton";
import { useAuth } from "@/lib/auth/AuthProvider";

function OnboardingPlaceholder() {
  const { user } = useAuth();
  return (
    <div className="flex flex-col gap-4">
      <p className="text-zinc-700 dark:text-zinc-300">
        You&apos;re signed in as <span className="font-medium text-zinc-900 dark:text-zinc-100">{user?.email}</span>.
      </p>
      <div className="flex flex-col gap-2 pt-2">
        <Link href="/dashboard" className="button button-primary w-full text-center py-2.5 rounded-lg font-medium">
          Open Divido Dashboard →
        </Link>
        <Link href="/transactions" className="text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 underline underline-offset-4 text-center">
          Go to Transactions
        </Link>
      </div>
      <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
        <SignOutButton />
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <AuthPageShell title="Welcome to Divido">
      <SessionGate require="signed-in" redirectTo="/sign-in">
        <OnboardingPlaceholder />
      </SessionGate>
    </AuthPageShell>
  );
}
