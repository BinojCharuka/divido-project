"use client";

import { SessionGate } from "@/components/auth/SessionGate";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { SIGNED_IN_HOME } from "./SignInForm";
import { SignUpForm } from "./SignUpForm";

export function SignUpScreen() {
  return (
    <AuthLayout title="Create your account" subtitle="Start your mindful money journey.">
      <SessionGate require="signed-out" redirectTo={SIGNED_IN_HOME}>
        <SignUpForm />
      </SessionGate>
    </AuthLayout>
  );
}
