import { GROUP_META } from "@/components/financial/groups";
import { amountDigits } from "@/lib/formatting/decimal";
import { formatMonthYear } from "@/lib/formatting/dates";
import type { Insights } from "@/types/insights";

const GAP = 1.8;

/** Share of the month's spending per group, using the backend's sharePercent figures. */
export function GroupShareChart({ insights }: { insights: Insights }) {
  const monthLabel = formatMonthYear(insights.month);
  const hasSpending = Number(insights.totalSpent) > 0;
  let offset = 0;
  const segments = insights.groups.map((g) => {
    const share = g.sharePercent === null ? 0 : Number(g.sharePercent);
    const segment = { group: g.group, share, offset };
    offset += share;
    return segment;
  });
  const label = hasSpending
    ? `Total spent LKR ${amountDigits(insights.totalSpent)}. ${insights.groups
        .map((g) => `${GROUP_META[g.group].label} ${g.sharePercent}%`)
        .join(", ")}.`
    : `Nothing recorded in ${monthLabel} yet.`;

  return (
    <section className="panel chart-panel group-chart" aria-labelledby="share-heading">
      <h2 id="share-heading">Where your money went</h2>
      <p>Spending by group · {monthLabel}</p>
      <div className="donut-layout">
        <div className="donut-chart" role="img" aria-label={label}>
          <svg viewBox="0 0 180 180" aria-hidden="true">
            <circle cx="90" cy="90" r="70" fill="none" stroke="var(--line)" strokeWidth="18" />
            {hasSpending &&
              segments
                .filter((s) => s.share > 0)
                .map((s) => {
                  const length = s.share >= 100 ? 100 : Math.max(0, s.share - GAP);
                  return (
                    <circle
                      key={s.group}
                      cx="90"
                      cy="90"
                      r="70"
                      fill="none"
                      stroke={`var(--${GROUP_META[s.group].label.toLowerCase()}-accent)`}
                      strokeWidth="18"
                      pathLength="100"
                      strokeDasharray={`${length} ${100 - length}`}
                      strokeDashoffset={-s.offset}
                      transform="rotate(-90 90 90)"
                    />
                  );
                })}
          </svg>
          <div>
            <span>Total spent</span>
            <strong>LKR {amountDigits(insights.totalSpent)}</strong>
          </div>
        </div>
      </div>
      <div className="group-chart-legend">
        {insights.groups.map((g) => {
          const { label: name, icon: Icon } = GROUP_META[g.group];
          return (
            <div key={g.group}>
              <Icon size={15} aria-hidden="true" />
              <span>{name}</span>
              <strong>LKR {amountDigits(g.spent)}</strong>
              <span>{g.sharePercent === null ? "—" : `${g.sharePercent}%`}</span>
            </div>
          );
        })}
      </div>
      <p className="chart-caption">
        Each expense counts toward its category’s current group, so moving a category to another group moves its past expenses too.
      </p>
    </section>
  );
}
