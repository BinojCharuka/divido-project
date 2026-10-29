import type { ReactNode } from "react";
import { TransactionPageShell } from "@/components/layout/TransactionPageShell";

export default function TransactionsLayout({ children }: { children: ReactNode }) {
  return <TransactionPageShell>{children}</TransactionPageShell>;
}
