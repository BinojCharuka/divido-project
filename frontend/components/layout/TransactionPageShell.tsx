import type { ReactNode } from "react";
import { SessionGate } from "@/components/auth/SessionGate";
import { AppShell } from "@/components/layout/AppShell";

/** Keeps every transaction route inside the existing signed-in session boundary. */
export function TransactionPageShell({ children }: { children: ReactNode }) {
  return (
    <SessionGate require="signed-in" redirectTo="/sign-in">
      <AppShell>{children}</AppShell>
    </SessionGate>
  );
}
