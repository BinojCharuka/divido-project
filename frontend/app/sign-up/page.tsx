"use client";

import { SessionGate } from "@/components/auth/SessionGate";
import { AuthPageShell } from "@/components/layout/AuthPageShell";
import { SIGNED_IN_HOME } from "@/features/auth/SignInForm";
import { SignUpForm } from "@/features/auth/SignUpForm";

export default function SignUpPage() {
  return (
    <AuthPageShell
      title="Create your account"
      subtitle="Start your mindful money journey."
      eyebrow="YOUR PERSONAL SPACE"
    >
      <SessionGate require="signed-out" redirectTo={SIGNED_IN_HOME}>
        <SignUpForm />
      </SessionGate>
    </AuthPageShell>
  );
}
