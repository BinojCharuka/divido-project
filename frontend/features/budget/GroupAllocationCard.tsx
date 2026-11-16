import { GroupBadge } from "@/components/financial/GroupBadge";
import { GROUP_META, pillarClass } from "@/components/financial/groups";
import { MoneyField } from "@/components/forms/MoneyField";
import type { DashboardGroup } from "@/lib/api/dashboard";
import { absAmount } from "@/lib/budget/plan";
import { amountDigits, percentWidth } from "@/lib/formatting/decimal";
import type { KakeiboGroup } from "@/types/category";

/** One group's planned amount, with this month's spend against the saved plan. */
export function GroupAllocationCard({
  group,
  value,
  error,
  disabled,
  spending: g,
  hasSavedPlan,
  onChange,
}: {
  group: KakeiboGroup;
  value: string;
  error?: string;
  disabled: boolean;
  spending: DashboardGroup | null;
  hasSavedPlan: boolean;
  onChange: (value: string) => void;
}) {
  const { label, icon: Icon, description } = GROUP_META[group];
  const usage =
    g && g.percentUsed !== null
      ? `${g.percentUsed}% of the saved amount used`
      : hasSavedPlan
        ? "Nothing planned for this group"
        : "Save a plan to track this group";

  return (
    <div className={`editable-budget-card panel ${pillarClass(group)}`}>
      <div className="editable-group-heading">
        <span className="group-icon" aria-hidden="true">
          <Icon size={21} />
        </span>
        <div>
          <h3>
            <GroupBadge group={group} />
          </h3>
          <p>{description}</p>
        </div>
      </div>
      <MoneyField
        label="Planned amount"
        accessibleLabel={`${label} planned amount`}
        name={`allocations.${group}`}
        value={value}
        error={error}
        disabled={disabled}
        onChange={onChange}
      />
      <dl className="editable-budget-stats">
        <div>
          <dt>Spent</dt>
          <dd>{g ? `LKR ${amountDigits(g.spent)}` : "—"}</dd>
        </div>
        <div>
          <dt>{g?.overBudget ? "Over plan" : "Remaining"}</dt>
          <dd>{g && g.remaining !== null ? `LKR ${amountDigits(absAmount(g.remaining))}` : "—"}</dd>
        </div>
      </dl>
      <div className="progress-track" aria-hidden="true">
        <span style={{ width: `${g?.overBudget ? 100 : percentWidth(g?.percentUsed)}%` }} />
      </div>
      <p className="budget-percent-text">{usage}</p>
    </div>
  );
}
