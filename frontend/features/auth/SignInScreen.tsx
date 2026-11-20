"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SessionGate } from "@/components/auth/SessionGate";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { useAuth } from "@/lib/auth/AuthProvider";
import { homeFor, SIGN_IN_NOTICES, type SignInNotice } from "@/lib/navigation";
import { SignInForm } from "./SignInForm";

const NOTICES: readonly string[] = SIGN_IN_NOTICES;

function SignInWithNotice() {
  const value = useSearchParams().get("notice");
  const notice = value && NOTICES.includes(value) ? (value as SignInNotice) : null;
  return <SignInForm notice={notice} />;
}

export function SignInScreen() {
  const { user } = useAuth();
  return (
    <AuthLayout customHeader>
      <SessionGate require="signed-out" redirectTo={homeFor(user)}>
        <Suspense fallback={<SignInForm notice={null} />}>
          <SignInWithNotice />
        </Suspense>
      </SessionGate>
    </AuthLayout>
  );
}
