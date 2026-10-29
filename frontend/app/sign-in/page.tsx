"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SessionGate } from "@/components/auth/SessionGate";
import { AuthPageShell } from "@/components/layout/AuthPageShell";
import { SIGNED_IN_HOME, SignInForm } from "@/features/auth/SignInForm";
import type { SignInNotice } from "@/lib/navigation";

const NOTICES: readonly string[] = ["registered", "signed-out", "session-ended"] satisfies SignInNotice[];

function SignInWithNotice() {
  const value = useSearchParams().get("notice");
  const notice = value && NOTICES.includes(value) ? (value as SignInNotice) : null;
  return <SignInForm notice={notice} />;
}

export default function SignInPage() {
  return (
    <AuthPageShell title="Sign in">
      <SessionGate require="signed-out" redirectTo={SIGNED_IN_HOME}>
        <Suspense fallback={<SignInForm notice={null} />}>
          <SignInWithNotice />
        </Suspense>
      </SessionGate>
    </AuthPageShell>
  );
}
