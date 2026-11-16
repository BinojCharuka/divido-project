"use client";

import { createContext, useContext } from "react";
import type { Transaction, TransactionType } from "@/types/transaction";

/**
 * Actions the app shell offers every page: the toast, and the transaction dialogs
 * (add / view / edit / delete) that pages and the mobile dock open. `dataVersion`
 * changes after every saved change, so pages know to load their data again.
 */
export interface AppShellActions {
  notify: (message: string) => void;
  openAdd: (type?: TransactionType) => void;
  openTransaction: (transaction: Transaction) => void;
  openEdit: (transaction: Transaction) => void;
  dataVersion: number;
}

export const AppShellContext = createContext<AppShellActions | null>(null);

export function useAppShell(): AppShellActions {
  const value = useContext(AppShellContext);
  if (!value) throw new Error("useAppShell must be used inside <AppShell>");
  return value;
}
