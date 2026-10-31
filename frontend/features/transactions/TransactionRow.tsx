import Link from "next/link";
import { KakeiboGroupBadge } from "@/components/financial/KakeiboGroupBadge";
import { MoneyAmount } from "@/components/financial/MoneyAmount";
import { formatDateRelative } from "@/lib/formatting/dates";
import type { Transaction } from "@/types/transaction";

export interface TransactionRowProps {
  transaction: Transaction;
}

export function TransactionRow({ transaction }: TransactionRowProps) {
  const isIncome = transaction.type === "INCOME";
  const title = isIncome
    ? transaction.incomeSource?.name ?? "Income"
    : transaction.category?.name ?? "Expense";

  return (
    <Link
      href={`/transactions/${transaction.id}/edit`}
      className="group flex items-center justify-between p-4 sm:px-5 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 transition-colors focus-visible:outline-none focus-visible:bg-zinc-50 dark:focus-visible:bg-zinc-800/60"
    >
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Type Icon Indicator */}
        <div
          aria-hidden="true"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-semibold ${
            isIncome
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-400"
              : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          }`}
        >
          {isIncome ? "↑" : "↓"}
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
              {title}
            </span>
            {transaction.category && (
              <KakeiboGroupBadge group={transaction.category.group} size="sm" />
            )}
            {transaction.paymentMethod && (
              <span className="text-[11px] px-1.5 py-0.5 rounded-sm bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 uppercase tracking-wider font-mono">
                {transaction.paymentMethod.replace("_", " ")}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            <span>{formatDateRelative(transaction.date)}</span>
            {transaction.description && (
              <>
                <span>•</span>
                <span className="truncate max-w-[200px] sm:max-w-xs">{transaction.description}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-3 text-right">
        <MoneyAmount
          amount={transaction.amount}
          type={transaction.type}
          showSign
          size="lg"
          className="group-hover:scale-102 transition-transform"
        />
        <span aria-hidden="true" className="text-zinc-300 dark:text-zinc-600 text-xs hidden sm:inline">
          →
        </span>
      </div>
    </Link>
  );
}
