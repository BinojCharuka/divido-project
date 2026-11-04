import type { ReactNode } from "react";
import { TransactionPageShell } from "@/components/layout/TransactionPageShell";

// Segment config must live in a Server Component; `instant` cannot be exported
// from the "use client" pages below, so it is set once for the whole segment here.
export const instant = false;

export default function TransactionsLayout({ children }: { children: ReactNode }) {
  return <TransactionPageShell>{children}</TransactionPageShell>;
}
