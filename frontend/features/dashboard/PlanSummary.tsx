import Link from "next/link";
import { ArrowRight, TriangleAlert, Wallet } from "lucide-react";
import type { Dashboard } from "@/lib/api/dashboard";
import { absAmount } from "@/lib/budget/plan";
import { amountDigits, shareOf } from "@/lib/formatting/decimal";

/**
 * The plan check (DEC-012 / DEC-028): planned income against savings plus group
 * allocations, and spend against the allocations. No "available money" figure (BR-008).
 */
export function PlanSummary({ dashboard: d, budgetHref }: { dashboard: Dashboard; budgetHref: string }) {
  const heading = (title: string) => (
    <div className="money-summary-heading">
      <span id="plan-heading">{title}</span>
      <span className="dark-icon" aria-hidden="true">
        <Wallet size={18} strokeWidth={1.5} />
      </span>
    </div>
  );

  if (!d.hasBudget || d.plannedIncome === null || d.allocationTotal === null) {
    return (
      <section className="money-summary" aria-labelledby="plan-heading">
        {heading("Monthly plan")}
        <p className="money-summary-empty">No plan for this month yet. Planned figures appear here once you save one.</p>
        <Link href={budgetHref} className="button button-primary money-summary-action">
          Plan this month <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </section>
    );
  }

  const over = d.overAllocated === true;
  const rows: [string, string | null][] = [
    ["Planned income", d.plannedIncome],
    ["Savings target", d.savingsTarget],
    ["Group allocations", d.allocationTotal],
  ];
  return (
    <section className="money-summary" aria-labelledby="plan-heading">
      {heading("Spent against group plans")}
      <div className="remaining-amount">
        <span>LKR</span> {amountDigits(d.totalSpent)}
      </div>
      <div className="remaining-label">of LKR {amountDigits(d.allocationTotal)} planned across groups</div>
      <div className="dark-progress" aria-hidden="true">
        <span style={{ width: `${shareOf(d.totalSpent, d.allocationTotal)}%` }} />
      </div>
      <dl className="money-calculation">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>LKR {amountDigits(value)}</dd>
          </div>
        ))}
        <div className="calculation-divider">
          <dt>{over ? "Planned above income" : "Left unplanned"}</dt>
          <dd>LKR {amountDigits(absAmount(d.overAllocationAmount ?? "0.00"))}</dd>
        </div>
      </dl>
      {over && (
        <p className="money-summary-warning">
          <TriangleAlert size={14} aria-hidden="true" /> Savings and allocations are above planned income.
        </p>
      )}
    </section>
  );
}
