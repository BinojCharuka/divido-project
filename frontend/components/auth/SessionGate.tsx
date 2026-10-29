"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { FormAlert } from "@/components/feedback/FormAlert";
import { useAuth } from "@/lib/auth/AuthProvider";

/**
 * Shows `children` only in the wanted session state and redirects otherwise.
 * Navigation convenience only: the backend enforces authentication on every request.
 */
export function SessionGate({
  require,
  redirectTo,
  children,
}: {
  require: "signed-in" | "signed-out";
  redirectTo: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const { status, refresh } = useAuth();
  const wrongState = (status === "signed-in" || status === "signed-out") && status !== require;

  useEffect(() => {
    if (wrongState) router.replace(redirectTo);
  }, [wrongState, redirectTo, router]);

  if (status === "unavailable") {
    return (
      <div className="flex flex-col gap-3">
        <FormAlert tone="error">We couldn&apos;t reach Divido. Check your connection and try again.</FormAlert>
        <button type="button" onClick={() => void refresh()} className="self-start font-medium underline">
          Try again
        </button>
      </div>
    );
  }
  if (status !== require) {
    return (
      <p role="status" className="text-zinc-700 dark:text-zinc-300">
        {status === "loading" ? "Checking your session…" : "Redirecting…"}
      </p>
    );
  }
  return <>{children}</>;
}
