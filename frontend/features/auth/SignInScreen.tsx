"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SessionGate } from "@/components/auth/SessionGate";
import { AuthLayout } from "@/components/layout/AuthLayout";
import type { SignInNotice } from "@/lib/navigation";
import { SIGNED_IN_HOME, SignInForm } from "./SignInForm";

const NOTICES: readonly string[] = ["registered", "signed-out", "session-ended"] satisfies SignInNotice[];

function SignInWithNotice() {
  const value = useSearchParams().get("notice");
  const notice = value && NOTICES.includes(value) ? (value as SignInNotice) : null;
  return <SignInForm notice={notice} />;
}

export function SignInScreen() {
  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to a calmer view of your money.">
      <SessionGate require="signed-out" redirectTo={SIGNED_IN_HOME}>
        <Suspense fallback={<SignInForm notice={null} />}>
          <SignInWithNotice />
        </Suspense>
      </SessionGate>
    </AuthLayout>
  );
}
