import type { ReactNode } from "react";
import { TransactionPageShell } from "@/components/layout/TransactionPageShell";

export const instant = false;

export default function Layout({ children }: { children: ReactNode }) {
  return <TransactionPageShell>{children}</TransactionPageShell>;
}
