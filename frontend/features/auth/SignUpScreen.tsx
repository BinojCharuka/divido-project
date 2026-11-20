"use client";

import { SessionGate } from "@/components/auth/SessionGate";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { useAuth } from "@/lib/auth/AuthProvider";
import { homeFor } from "@/lib/navigation";
import { SignUpForm } from "./SignUpForm";

export function SignUpScreen() {
  const { user } = useAuth();
  return (
    <AuthLayout customHeader>
      <SessionGate require="signed-out" redirectTo={homeFor(user)}>
        <SignUpForm />
      </SessionGate>
    </AuthLayout>
  );
}
