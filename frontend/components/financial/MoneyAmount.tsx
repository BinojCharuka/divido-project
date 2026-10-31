import { formatMoney, formatSignedMoney } from "@/lib/formatting/money";
import type { TransactionType } from "@/types/transaction";

export interface MoneyAmountProps {
  amount: string | number;
  type?: TransactionType | "INCOME" | "EXPENSE" | "NEUTRAL";
  showSign?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeStyles = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base font-semibold",
  xl: "text-xl sm:text-2xl font-bold tracking-tight",
};

export function MoneyAmount({
  amount,
  type = "NEUTRAL",
  showSign = false,
  size = "md",
  className = "",
}: MoneyAmountProps) {
  const isIncome = type === "INCOME";
  const isExpense = type === "EXPENSE";

  let formatted = formatMoney(amount);
  let sign = "";

  if (showSign && (isIncome || isExpense)) {
    const signed = formatSignedMoney(amount, type);
    sign = signed.sign + " ";
    formatted = signed.text;
  }

  const colorStyles = isIncome
    ? "text-emerald-700 dark:text-emerald-400"
    : isExpense
    ? "text-zinc-900 dark:text-zinc-100"
    : "text-zinc-900 dark:text-zinc-100";

  return (
    <span className={`inline-flex items-baseline font-mono tabular-nums ${sizeStyles[size]} ${colorStyles} ${className}`}>
      {sign && <span className="mr-0.5 font-sans font-medium">{sign}</span>}
      <span>{formatted}</span>
    </span>
  );
}
