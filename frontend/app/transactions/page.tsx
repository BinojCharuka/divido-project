"use client";

<<<<<<< HEAD
import dynamic from "next/dynamic";
=======
export const instant = false;

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { EmptyState } from "@/components/feedback/EmptyState";
import { FormAlert } from "@/components/feedback/FormAlert";
import { TransactionListSkeleton } from "@/components/feedback/LoadingSkeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { PaginationControls } from "@/components/ui/PaginationControls";
import { TransactionFilters } from "@/features/transactions/TransactionFilters";
import { TransactionRow } from "@/features/transactions/TransactionRow";
import { listTransactions } from "@/lib/api/transactions";
import { getCurrentMonth, getMonthDateRange } from "@/lib/formatting/dates";
import type { Transaction, TransactionType } from "@/types/transaction";
>>>>>>> 0112277 (feat: export instant equals false in transaction pages and layout)

const FigmaApp = dynamic(() => import("@/features/prototype/FigmaApp"), {
  ssr: false,
  loading: () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <p>Loading Transactions…</p>
    </div>
  ),
});

export default function TransactionsPage() {
  return <FigmaApp initialPage="Transactions" />;
}
