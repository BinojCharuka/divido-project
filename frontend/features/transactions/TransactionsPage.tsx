"use client";

import { useState } from "react";
import { History, Plus, Trash2 } from "lucide-react";
import { InlineError } from "@/components/feedback/InlineError";
import { LoadingPanel } from "@/components/feedback/LoadingPanel";
import { Money } from "@/components/financial/Money";
import { MonthSelector } from "@/components/financial/MonthSelector";
import { useAppShell } from "@/components/layout/AppShellContext";
import { PageHeading } from "@/components/layout/PageHeading";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/ui/Pagination";
import { listCategories } from "@/lib/api/categories";
import { getDashboard } from "@/lib/api/dashboard";
import { listIncomeSources } from "@/lib/api/income-sources";
import { listTransactions } from "@/lib/api/transactions";
import { formatMonthYear, getMonthDateRange } from "@/lib/formatting/dates";
import { useApiData } from "@/lib/useApiData";
import { isFiltered, TransactionFilters, type TransactionFilterValues } from "./TransactionFilters";
import { TransactionRows } from "./TransactionRows";
import { ClearTransactionsDialog } from "./ClearTransactionsDialog";

export const PAGE_SIZE = 20;

/**
 * Transaction history for one month. Filters and paging run in the API
 * (GET /api/v1/transactions); month totals come from the dashboard aggregate.
 */
export function TransactionsPage({ month, onMonthChange }: { month: string; onMonthChange: (m: string) => void }) {
  const { openAdd, openTransaction, notify, refreshData, dataVersion } = useAppShell();
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [filters, setFilters] = useState<TransactionFilterValues>({});
  // A page number belongs to the month it was chosen in; a new month starts at page 0.
  const [paging, setPaging] = useState({ month, page: 0 });
  const page = paging.month === month ? paging.page : 0;
  const setPage = (next: number) => setPaging({ month, page: next });

  const { type, categoryId, incomeSourceId } = filters;
  const list = useApiData(
    () => {
      const { from, to } = getMonthDateRange(month);
      return listTransactions({ page, size: PAGE_SIZE, from, to, type, categoryId, incomeSourceId });
    },
    [month, page, type, categoryId, incomeSourceId, dataVersion],
    "We couldn't load your transactions. Check your connection and try again.",
  );
  const totals = useApiData(() => getDashboard(month), [month, dataVersion], "");
  // Inactive entries stay in the filters so older records remain findable.
  const options = useApiData(
    () => Promise.all([listCategories({ includeInactive: true }), listIncomeSources({ includeInactive: true })]),
    [dataVersion],
    "",
  );

  function changeFilters(next: TransactionFilterValues) {
    setFilters(next);
    setPage(0);
  }

  const filtered = isFiltered(filters);
  const monthLabel = formatMonthYear(month);
  const [categories, sources] = options.status === "ready" ? options.data : [[], []];

  return (
    <>
      <div className="transactions-header-wrap flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 mb-4">
        <div>
          <span className="text-[11px] font-bold tracking-[0.2em] text-[#34d399] uppercase block mb-1">
            MONEY MOVEMENT
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Transaction history</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">Search, review, and manage every recorded transaction.</p>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-2.5 w-full sm:w-auto">
          <MonthSelector month={month} onChange={onMonthChange} />
          <button
            type="button"
            onClick={() => setClearDialogOpen(true)}
            aria-label="Clear all transactions"
            title="Clear all transactions"
            className="h-10 px-3 sm:px-3.5 rounded-xl sm:rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer shrink-0 text-xs sm:text-sm font-medium"
          >
            <Trash2 size={16} strokeWidth={2} aria-hidden="true" />
            <span className="hidden sm:inline">Clear all</span>
          </button>
          <button
            type="button"
            onClick={() => openAdd()}
            aria-label="Add transaction"
            className="w-10 h-10 sm:w-auto sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl bg-[#10b981] hover:bg-[#059669] text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-transform active:scale-95 cursor-pointer shrink-0"
          >
            <Plus size={18} strokeWidth={2.5} aria-hidden="true" />
            <span className="hidden sm:inline text-sm font-semibold">Add transaction</span>
          </button>
        </div>
      </div>
      <div className="sr-only">
        <PageHeading
          title="Transactions"
          actions={
            <Button variant="primary" onClick={() => openAdd()}>
              <Plus size={17} aria-hidden="true" />
              Add transaction
            </Button>
          }
        />
      </div>

      <div className="transaction-summary-strip">
        <span>
          {list.status === "ready" ? list.data.totalItems : "…"} {filtered ? "matching records" : "records"}{" "}
          <span className="muted">in {monthLabel}</span>
        </span>
        {totals.status === "ready" && (
          <div>
            <span>
              Recorded income <Money className="positive" value={totals.data.recordedIncome} sign="+" />
            </span>
            <span>
              Spent <Money value={totals.data.totalSpent} sign="−" />
            </span>
          </div>
        )}
      </div>

      <section className="panel transactions-panel" aria-label={`Transactions in ${monthLabel}`}>
        <TransactionFilters
          values={filters}
          onChange={changeFilters}
          categories={categories}
          sources={sources}
          optionsUnavailable={options.status === "error"}
        />
        {list.status === "loading" && <LoadingPanel label="Loading transactions…" />}
        {list.status === "error" && <InlineError message={list.message} onRetry={list.retry} />}
        {list.status === "ready" && (
          <div className="animate-content-reveal">
            <TransactionRows
              full
              transactions={list.data.items}
              onOpen={openTransaction}
              empty={
                filtered ? (
                  <div className="empty-state">
                    <h3>No transactions match these filters</h3>
                    <p>Try another type, category or income source.</p>
                    <Button onClick={() => changeFilters({})}>Clear filters</Button>
                  </div>
                ) : (
                  <div className="empty-state text-center py-10">
                    <div className="w-14 h-14 rounded-2xl bg-[#13271c] border border-emerald-500/20 text-[#34d399] flex items-center justify-center mx-auto mb-3 shadow-md">
                      <History size={26} strokeWidth={2.2} />
                    </div>
                    <h3 className="text-lg font-semibold text-white">Your history is ready</h3>
                    <span className="sr-only">No transactions in {monthLabel}</span>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-sm mx-auto">
                      New income and expenses will appear here, grouped by date.
                    </p>
                    <div className="mt-5 flex justify-center">
                      <Button variant="primary" onClick={() => openAdd()} className="bg-[#10b981] hover:bg-[#059669] text-white">
                        <Plus size={16} aria-hidden="true" />
                        Add transaction
                      </Button>
                    </div>
                  </div>
                )
              }
            />
            <Pagination page={list.data.page} totalPages={list.data.totalPages} label="Transaction pages" onPageChange={setPage} />
          </div>
        )}
      </section>
      {clearDialogOpen && (
        <ClearTransactionsDialog
          onCancel={() => setClearDialogOpen(false)}
          onDone={(msg) => {
            setClearDialogOpen(false);
            notify(msg);
            refreshData?.();
          }}
        />
      )}
    </>
  );
}
