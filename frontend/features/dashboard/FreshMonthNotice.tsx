import Link from "next/link";
import { Plus, Sparkles, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Dashboard } from "@/lib/api/dashboard";

/** Shown when a month has neither a plan nor any records. */
export function FreshMonthNotice({
  dashboard: d,
  monthLabel,
  budgetHref,
  onAddIncome,
}: {
  dashboard: Dashboard;
  monthLabel: string;
  budgetHref: string;
  onAddIncome: () => void;
}) {
  if (d.hasBudget || d.incomeTransactionCount > 0 || d.expenseTransactionCount > 0) return null;
  return (
    <div className="panel fresh-month">
      <span className="fresh-month-icon" aria-hidden="true">
        <Sparkles size={18} />
      </span>
      <div>
        <strong>Nothing planned or recorded for {monthLabel}</strong>
        <span>Set a plan for the month, or add your first transaction.</span>
      </div>
      <div className="fresh-month-actions">
        <Link href={budgetHref} className="button button-primary">
          <Wallet size={15} aria-hidden="true" /> Plan this month
        </Link>
        <Button onClick={onAddIncome}>
          <Plus size={15} aria-hidden="true" /> Add income
        </Button>
      </div>
    </div>
  );
}
