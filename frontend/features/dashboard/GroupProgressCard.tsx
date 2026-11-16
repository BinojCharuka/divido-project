import Link from "next/link";
import { ArrowUpRight, TriangleAlert } from "lucide-react";
import { GroupBadge } from "@/components/financial/GroupBadge";
import { GROUP_META, pillarClass } from "@/components/financial/groups";
import type { DashboardGroup } from "@/lib/api/dashboard";
import { absAmount } from "@/lib/budget/plan";
import { amountDigits, isNegativeAmount, percentWidth } from "@/lib/formatting/decimal";

/** One spending group: recorded spend against its plan, using the backend's figures. */
export function GroupProgressCard({ group: g, href }: { group: DashboardGroup; href: string }) {
  const { label, icon: Icon } = GROUP_META[g.group];
  const over = g.overBudget === true;
  const hasPlan = g.budget !== null;
  const width = over ? 100 : hasPlan ? percentWidth(g.percentUsed) : 0;
  const footer =
    hasPlan && g.remaining !== null
      ? `LKR ${amountDigits(absAmount(g.remaining))} ${isNegativeAmount(g.remaining) ? "over plan" : "left"}`
      : `${g.expenseCount} ${g.expenseCount === 1 ? "expense" : "expenses"}`;

  return (
    <Link href={href} className={`budget-card ${pillarClass(g.group)} ${over ? "over-budget" : ""}`}>
      <div className="budget-card-top">
        <span className="group-icon" aria-hidden="true">
          <Icon size={19} strokeWidth={1.65} />
        </span>
        <GroupBadge group={g.group} />
        <ArrowUpRight size={16} className="budget-arrow" aria-hidden="true" />
      </div>
      <div className="budget-value">
        LKR {amountDigits(g.spent)}
        <span> spent</span>
      </div>
      <div className="budget-planned">{hasPlan ? `of LKR ${amountDigits(g.budget)} planned` : "No plan for this month"}</div>
      <div
        className={`progress-track ${over ? "striped" : ""}`}
        role="progressbar"
        aria-label={`${label} plan used`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={hasPlan && g.percentUsed !== null ? Math.min(100, Number(g.percentUsed)) : undefined}
        aria-valuetext={!hasPlan ? "No plan" : g.percentUsed !== null ? `${g.percentUsed}% used` : "Nothing planned"}
      >
        <span style={{ width: `${width}%` }} />
      </div>
      <div className="budget-card-bottom">
        <span>
          {over && <TriangleAlert size={12} aria-hidden="true" />}
          {footer}
        </span>
        <strong>{hasPlan && g.percentUsed !== null ? `${g.percentUsed}%` : "—"}</strong>
      </div>
    </Link>
  );
}
