"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { SessionGate } from "@/components/auth/SessionGate";
import { AuthPageShell } from "@/components/layout/AuthPageShell";
import { SIGNED_IN_HOME } from "@/features/auth/SignInForm";
import { useAuth } from "@/lib/auth/AuthProvider";

/** Sends the visitor to the signed-in home or to sign-in, once the session is known. */
export default function Home() {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "signed-in") router.replace(SIGNED_IN_HOME);
  }, [status, router]);

  return (
    <AuthPageShell title="Welcome">
      <SessionGate require="signed-in" redirectTo="/sign-in">
        <p role="status">Redirecting…</p>
      </SessionGate>
    </AuthPageShell>
  );
}
