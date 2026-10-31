import type { TransactionType } from "@/types/transaction";

export interface TransactionTypeBadgeProps {
  type: TransactionType;
  size?: "sm" | "md";
  className?: string;
}

export function TransactionTypeBadge({ type, size = "sm", className = "" }: TransactionTypeBadgeProps) {
  const isIncome = type === "INCOME";

  const sizeStyles = size === "sm" ? "px-2 py-0.5 text-xs gap-1" : "px-2.5 py-1 text-sm gap-1.5";

  const styles = isIncome
    ? "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
    : "bg-zinc-100 text-zinc-800 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700";

  return (
    <span className={`inline-flex items-center rounded-md border font-medium ${sizeStyles} ${styles} ${className}`}>
      <span aria-hidden="true" className="font-bold">
        {isIncome ? "↑" : "↓"}
      </span>
      <span>{isIncome ? "Income" : "Expense"}</span>
    </span>
  );
}
