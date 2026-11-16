import { GROUP_META } from "@/components/financial/groups";
import { amountDigits } from "@/lib/formatting/decimal";
import { formatDateDisplay, formatMonthYear, shiftMonth } from "@/lib/formatting/dates";
import type { Insights, Observation } from "@/types/insights";

/**
 * Wording for the four DEC-031 observation types. Each sentence states only what
 * the backend's figures show: no advice, scores, predictions or causes, and no
 * "habit" or "regular" label (BR-026, BR-027). Group names are the plain labels
 * (DEC-042).
 */
export interface ObservationCopy {
  title: string;
  text: string;
  /** The period and basis behind the observation (AC-020). */
  evidence: string;
}

const lkr = (value: string) => `LKR ${amountDigits(value)}`;
const days = (n: number) => `${n} ${n === 1 ? "day" : "days"}`;
const times = (n: number) => `${n} ${n === 1 ? "time" : "times"}`;

/** "Nov 1 – Nov 16, 2026" for a date-only range. */
export function formatRange(from: string, to: string): string {
  const start = formatDateDisplay(from);
  const end = formatDateDisplay(to);
  if (from.slice(0, 4) === to.slice(0, 4)) return `${start.replace(/, \d{4}$/, "")} – ${end}`;
  return `${start} – ${end}`;
}

export function observationCopy(observation: Observation, insights: Insights): ObservationCopy {
  const monthLabel = formatMonthYear(insights.month);
  switch (observation.type) {
    case "LARGEST_GROUP": {
      const label = GROUP_META[observation.group].label;
      return {
        title: `${label} was your largest group`,
        text: `You recorded ${lkr(observation.spent)} in ${label}, ${observation.sharePercent}% of your spending in ${monthLabel}.`,
        evidence: `${monthLabel} · spending on ${days(observation.spendingDays)}`,
      };
    }
    case "GROUP_OVER_PLAN": {
      const label = GROUP_META[observation.group].label;
      return {
        title: `${label} is above its plan`,
        text: `You recorded ${lkr(observation.spent)} against a plan of ${lkr(observation.budget)}, which is ${lkr(observation.overBy)} more than planned.`,
        evidence: `${monthLabel} · plan compared with recorded spending`,
      };
    }
    case "MONTH_CHANGE": {
      const previousMonth = formatMonthYear(shiftMonth(insights.month, -1));
      const range = formatRange(insights.comparison.currentStart, insights.comparison.currentEnd);
      const change = observation.changePercent;
      const direction =
        change === null || Number(change) === 0
          ? "the same as"
          : `${change.replace(/^-/, "")}% ${Number(change) > 0 ? "more than" : "less than"}`;
      const span = insights.partialMonth ? `the same days of ${previousMonth}` : previousMonth;
      return {
        title: `Compared with ${previousMonth}`,
        text: `You recorded ${lkr(observation.currentSpent)}, ${direction} the ${lkr(observation.previousSpent)} you recorded in ${span}.`,
        evidence: `${range} · compared with ${formatRange(insights.comparison.previousStart, insights.comparison.previousEnd)}`,
      };
    }
    case "REPEATED_CATEGORY":
      return {
        title: `${observation.categoryName} on ${days(observation.distinctDays)}`,
        text: `You recorded ${observation.categoryName} ${times(observation.transactionCount)} on ${days(observation.distinctDays)}, most recently on ${formatDateDisplay(observation.dates[observation.dates.length - 1])}.`,
        evidence: `Last 90 days · ${formatRange(insights.lookbackStart, insights.lookbackEnd)}`,
      };
  }
}
