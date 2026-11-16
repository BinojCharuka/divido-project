"use client";

import type { ReactNode } from "react";
import { ArrowDownLeft, ArrowLeftRight, ChevronRight } from "lucide-react";
import { GROUP_META } from "@/components/financial/groups";
import { amountDigits } from "@/lib/formatting/decimal";
import { formatDateDisplay } from "@/lib/formatting/dates";
import type { Transaction } from "@/types/transaction";

/** What a row calls the record: its description, else its category or income source. */
export function transactionTitle(t: Transaction): string {
  if (t.description) return t.description;
  if (t.type === "INCOME") return t.incomeSource?.name ?? "Income";
  return t.category?.name ?? "Expense";
}

export function transactionSubtitle(t: Transaction): string {
  if (t.type === "INCOME") return t.incomeSource?.name ?? "No income source";
  const group = t.category ? GROUP_META[t.category.group].label : "";
  return [t.category?.name, group].filter(Boolean).join(" · ");
}

export function TransactionIcon({ transaction }: { transaction: Transaction }) {
  const income = transaction.type === "INCOME";
  const Icon = income ? ArrowDownLeft : transaction.category ? GROUP_META[transaction.category.group].icon : ArrowLeftRight;
  return (
    <span className={`transaction-icon ${income ? "income-icon" : ""}`} aria-hidden="true">
      <Icon size={19} strokeWidth={1.7} />
    </span>
  );
}

export function TransactionRows({
  transactions,
  onOpen,
  full = false,
  empty,
}: {
  transactions: Transaction[];
  onOpen: (t: Transaction) => void;
  full?: boolean;
  empty: ReactNode;
}) {
  if (transactions.length === 0) {
    return <div className={`transaction-list ${full ? "full-list" : ""}`}>{empty}</div>;
  }
  return (
    <ul className={`transaction-list ${full ? "full-list" : ""}`}>
      {transactions.map((t) => {
        const income = t.type === "INCOME";
        const title = transactionTitle(t);
        return (
          <li key={t.id}>
            <button
              type="button"
              className="transaction-row"
              onClick={() => onOpen(t)}
              aria-label={`${title}, ${income ? "income" : "expense"} of LKR ${amountDigits(t.amount)} on ${formatDateDisplay(t.date)}`}
            >
              <TransactionIcon transaction={t} />
              <div className="transaction-description">
                <strong>{title}</strong>
                <span>{transactionSubtitle(t)}</span>
              </div>
              <span className="transaction-date">{formatDateDisplay(t.date)}</span>
              {full && (
                <span className={`type-badge ${income ? "type-income" : ""}`}>{income ? "+ Income" : "− Expense"}</span>
              )}
              <span className={`transaction-amount ${income ? "positive" : ""}`}>
                {income ? "+" : "−"} LKR {amountDigits(t.amount)}
              </span>
              <ChevronRight className="row-chevron" size={15} aria-hidden="true" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
