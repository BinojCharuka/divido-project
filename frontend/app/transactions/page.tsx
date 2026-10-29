import Link from "next/link";
import { EmptyState } from "@/components/feedback/EmptyState";
import { TransactionFilters } from "@/features/transactions/TransactionFilters";

export default function TransactionsPage() {
  return (
    <div className="pb-20 sm:pb-0">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-wide text-[var(--primary-strong)]">Your records</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Transactions</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[var(--text-secondary)]">Review your recorded income and expenses in one clear place.</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link href="/transactions/new-income" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] outline-none hover:bg-[var(--surface-muted)] focus-visible:ring-2 focus-visible:ring-[var(--focus)]">+ Add income</Link>
          <Link href="/transactions/new-expense" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white outline-none hover:bg-[var(--primary-strong)] focus-visible:ring-2 focus-visible:ring-[var(--focus)]">+ Add expense</Link>
        </div>
      </div>
      <div className="mt-8"><TransactionFilters /></div>
      <div className="mt-6"><EmptyState title="Your transactions will appear here" detail="When transaction history is connected, you will be able to review, filter, edit, and safely remove your own entries." action={{ href: "/transactions/new-expense", label: "Add your first expense" }} /></div>
    </div>
  );
}
