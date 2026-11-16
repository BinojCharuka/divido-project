import { ArrowDownLeft, ArrowUpRight, Target, Wallet, type LucideIcon } from "lucide-react";
import type { Dashboard } from "@/lib/api/dashboard";
import { amountDigits } from "@/lib/formatting/decimal";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** The four headline figures for the month. Planned ones read "Not planned" without a plan. */
export function SummaryCards({ dashboard: d }: { dashboard: Dashboard }) {
  const cards: { label: string; value: string | null; icon: LucideIcon; note?: string; className?: string }[] = [
    { label: "Planned income", value: d.plannedIncome, icon: Wallet },
    { label: "Recorded income", value: d.recordedIncome, icon: ArrowDownLeft, note: plural(d.incomeTransactionCount, "record", "records") },
    { label: "Spent this month", value: d.totalSpent, icon: ArrowUpRight, note: plural(d.expenseTransactionCount, "expense", "expenses") },
    { label: "Savings target", value: d.savingsTarget, icon: Target, className: "savings-stat" },
  ];
  return (
    <div className="overview-grid">
      {cards.map(({ label, value, icon: Icon, note, className }) => (
        <div className={`summary-card ${className ?? ""}`} key={label}>
          <div className="summary-label">
            {label}
            <Icon size={17} strokeWidth={1.7} aria-hidden="true" />
          </div>
          <div className="summary-value">
            {value === null ? (
              <span className="summary-empty">Not planned</span>
            ) : (
              <>
                <span>LKR</span> {amountDigits(value)}
              </>
            )}
          </div>
          {note && <div className="summary-note">{note}</div>}
        </div>
      ))}
    </div>
  );
}
