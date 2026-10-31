"use client";

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

const NOTICES: Record<string, string> = {
  "expense-saved": "Expense saved successfully.",
  "income-saved": "Income recorded successfully.",
  deleted: "Transaction deleted.",
  updated: "Transaction updated.",
};

function TransactionsContent() {
  const searchParams = useSearchParams();
  const noticeKey = searchParams.get("notice");
  const notice = noticeKey && NOTICES[noticeKey] ? NOTICES[noticeKey] : null;

  const [month, setMonth] = useState(getCurrentMonth());
  const [type, setType] = useState<TransactionType | undefined>(undefined);
  const [page, setPage] = useState(0);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch transactions whenever month, type, or page changes
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const { from, to } = getMonthDateRange(month);
        const data = await listTransactions({
          page,
          size: 20,
          type,
          from,
          to,
        });

        if (active) {
          setTransactions(data.items);
          setTotalItems(data.totalItems);
          setTotalPages(data.totalPages);
        }
      } catch {
        if (active) setError("Could not load transactions. Please check your connection.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [month, type, page]);

  function handleTypeChange(newType?: TransactionType) {
    setType(newType);
    setPage(0); // Reset to page 0
  }

  function handleMonthChange(newMonth: string) {
    setMonth(newMonth);
    setPage(0);
  }

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle="Review, filter, and manage your income and spending."
        action={
          <div className="flex items-center gap-2">
            <Link href="/transactions/new-expense">
              <Button variant="secondary" size="sm">
                + Expense
              </Button>
            </Link>
            <Link href="/transactions/new-income">
              <Button variant="primary" size="sm">
                + Income
              </Button>
            </Link>
          </div>
        }
      />

      {notice && (
        <div className="mb-4">
          <FormAlert tone="info">{notice}</FormAlert>
        </div>
      )}

      {error && (
        <div className="mb-4">
          <FormAlert tone="error">{error}</FormAlert>
        </div>
      )}

      <TransactionFilters
        currentType={type}
        currentMonth={month}
        onTypeChange={handleTypeChange}
        onMonthChange={handleMonthChange}
      />

      {loading ? (
        <TransactionListSkeleton count={5} />
      ) : transactions.length === 0 ? (
        <EmptyState
          title={type ? `No ${type.toLowerCase()} transactions found` : "No transactions recorded"}
          description={
            type
              ? `There are no ${type.toLowerCase()} entries recorded for the selected period.`
              : "Start recording your daily expenses or income to track your monthly budget."
          }
          action={
            <div className="flex items-center gap-3">
              <Link href="/transactions/new-expense">
                <Button variant="primary" size="sm">
                  Record Expense
                </Button>
              </Link>
              <Link href="/transactions/new-income">
                <Button variant="secondary" size="sm">
                  Record Income
                </Button>
              </Link>
            </div>
          }
        />
      ) : (
        <div className="flex flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/80 shadow-xs">
          {transactions.map((transaction) => (
            <TransactionRow key={transaction.id} transaction={transaction} />
          ))}
        </div>
      )}

      <PaginationControls
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={setPage}
      />
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<TransactionListSkeleton count={5} />}>
      <TransactionsContent />
    </Suspense>
  );
}
