"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { FormAlert } from "@/components/feedback/FormAlert";
import { TransactionRowSkeleton } from "@/components/feedback/LoadingSkeleton";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { TransactionEditForm } from "@/features/transactions/TransactionEditForm";
import { getTransaction } from "@/lib/api/transactions";
import type { Transaction } from "@/types/transaction";

export default function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await getTransaction(id);
        if (active) setTransaction(data);
      } catch {
        if (active) setError("Transaction not found or could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div>
      <PageHeader
        title="Edit Transaction"
        subtitle="Update details or remove this transaction record."
        backHref="/transactions"
      />

      {loading ? (
        <div className="max-w-xl mx-auto rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <TransactionRowSkeleton />
        </div>
      ) : error || !transaction ? (
        <div className="max-w-xl mx-auto flex flex-col gap-4">
          <FormAlert tone="error">{error ?? "Transaction not found."}</FormAlert>
          <Link href="/transactions">
            <Button variant="secondary" size="sm">
              Return to Transactions
            </Button>
          </Link>
        </div>
      ) : (
        <TransactionEditForm transaction={transaction} />
      )}
    </div>
  );
}
