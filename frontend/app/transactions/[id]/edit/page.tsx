"use client";

<<<<<<< HEAD
import dynamic from "next/dynamic";
=======
export const instant = false;

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { FormAlert } from "@/components/feedback/FormAlert";
import { TransactionRowSkeleton } from "@/components/feedback/LoadingSkeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { TransactionEditForm } from "@/features/transactions/TransactionEditForm";
import { getTransaction } from "@/lib/api/transactions";
import type { Transaction } from "@/types/transaction";
>>>>>>> 0112277 (feat: export instant equals false in transaction pages and layout)

const FigmaApp = dynamic(() => import("@/features/prototype/FigmaApp"), {
  ssr: false,
  loading: () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", fontFamily: "sans-serif" }}>
      <p>Loading…</p>
    </div>
  ),
});

export default function EditTransactionPage() {
  return <FigmaApp initialPage="Transactions" />;
}
