import type { ReactNode } from "react";
import { SessionGate } from "@/components/auth/SessionGate";
import { AppShell } from "@/components/layout/AppShell";

/**
 * Keeps signed-in application routes (transactions, categories, income sources)
 * inside the existing session boundary and the shared app navigation.
 */
export function TransactionPageShell({ children }: { children: ReactNode }) {
  return (
    <SessionGate require="signed-in" redirectTo="/sign-in">
      <AppShell>{children}</AppShell>
    </SessionGate>
  );
}
