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
import {
  isFiltered,
  TransactionFilters,
  type TransactionFilterValues,
} from "@/features/transactions/TransactionFilters";
import { TransactionRow } from "@/features/transactions/TransactionRow";
import { listCategories } from "@/lib/api/categories";
import { ApiError } from "@/lib/api/client";
import { listIncomeSources } from "@/lib/api/income-sources";
import { listTransactions } from "@/lib/api/transactions";
import { getCurrentMonth, getMonthDateRange } from "@/lib/formatting/dates";
import type { Category } from "@/types/category";
import type { IncomeSource } from "@/types/income-source";
import type { Transaction } from "@/types/transaction";

const NOTICES: Record<string, string> = {
  "expense-saved": "Expense saved successfully.",
  "income-saved": "Income recorded successfully.",
  deleted: "Transaction deleted.",
  updated: "Transaction updated.",
  "not-found": "That transaction no longer exists. It may have been deleted already.",
};

function TransactionsContent() {
  const searchParams = useSearchParams();
  const noticeKey = searchParams.get("notice");
  const notice = noticeKey && NOTICES[noticeKey] ? NOTICES[noticeKey] : null;

  const [filters, setFilters] = useState<TransactionFilterValues>(() => ({ month: getCurrentMonth() }));
  const [page, setPage] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  const [categories, setCategories] = useState<Category[]>([]);
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([listCategories({ includeInactive: true }), listIncomeSources({ includeInactive: true })])
      .then(([cats, sources]) => {
        if (!active) return;
        setCategories(cats);
        setIncomeSources(sources);
      })
      .catch(() => {
        if (active) setOptionsError("Category and income source filters are unavailable right now.");
      });
    return () => {
      active = false;
    };
  }, []);

  const { month, type, categoryId, incomeSourceId } = filters;

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
          categoryId,
          incomeSourceId,
        });

        if (active) {
          setTransactions(data.items);
          setTotalItems(data.totalItems);
          setTotalPages(data.totalPages);
        }
      } catch (err) {
        if (active) {
          setTransactions([]);
          setError(
            err instanceof ApiError && err.kind !== "network" && err.kind !== "server"
              ? err.message
              : "Could not load transactions. Please check your connection.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [month, type, categoryId, incomeSourceId, page, reloadKey]);

  function handleFiltersChange(next: TransactionFilterValues) {
    setFilters(next);
    setPage(0);
  }

  const filtered = isFiltered(filters);

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

      <TransactionFilters
        values={filters}
        onChange={handleFiltersChange}
        categories={categories}
        incomeSources={incomeSources}
        optionsError={optionsError}
      />

      {loading ? (
        <TransactionListSkeleton count={5} />
      ) : error ? (
        <div className="flex flex-col gap-3">
          <FormAlert tone="error">{error}</FormAlert>
          <Button variant="secondary" size="sm" className="self-start" onClick={() => setReloadKey((k) => k + 1)}>
            Try again
          </Button>
        </div>
      ) : transactions.length === 0 && filtered ? (
        <EmptyState
          title="No transactions match these filters"
          description="Try a different period, type, category or income source."
          action={
            <Button variant="secondary" size="sm" onClick={() => handleFiltersChange({ month: getCurrentMonth() })}>
              Clear filters
            </Button>
          }
        />
      ) : transactions.length === 0 ? (
        <EmptyState
          title="No transactions recorded this month"
          description="Start recording your daily expenses or income to track your monthly budget."
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

      {!loading && !error && (
        <PaginationControls
          page={page}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

export function TransactionsView() {
  return (
    <Suspense fallback={<TransactionListSkeleton count={5} />}>
      <TransactionsContent />
    </Suspense>
  );
}

export default TransactionsView;
