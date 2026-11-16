"use client";

import { CalendarDays, ChartNoAxesCombined, Plus } from "lucide-react";
import { InlineError } from "@/components/feedback/InlineError";
import { LoadingPanel } from "@/components/feedback/LoadingPanel";
import { MonthSelector } from "@/components/financial/MonthSelector";
import { useAppShell } from "@/components/layout/AppShellContext";
import { PageHeading } from "@/components/layout/PageHeading";
import { Button } from "@/components/ui/Button";
import { getInsights } from "@/lib/api/insights";
import { formatMonthYear, getCurrentMonth } from "@/lib/formatting/dates";
import { useApiData } from "@/lib/useApiData";
import type { Insights } from "@/types/insights";
import { GroupShareChart } from "./GroupShareChart";
import { ObservationCard } from "./ObservationCard";
import { formatRange } from "./observationCopy";
import { SpendingTrendChart } from "./SpendingTrendChart";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * INSIGHT-001 (DIV-027). Shows only the observations the backend returns, each with
 * its period and basis; figures are never calculated here. Month observations need
 * at least three distinct spending days (DEC-031); below that the page says so
 * instead of presenting a pattern (AC-019).
 */
export function InsightsPage({ month, onMonthChange }: { month: string; onMonthChange: (m: string) => void }) {
  const { openAdd, dataVersion } = useAppShell();
  const future = month > getCurrentMonth();
  const data = useApiData<Insights | null>(
    () => (future ? Promise.resolve(null) : getInsights(month)),
    [month, dataVersion],
    "We couldn't load your insights. Check your connection and try again.",
  );
  const monthLabel = formatMonthYear(month);

  return (
    <>
      <PageHeading
        title="Spending insights"
        subtitle={`What your records show for ${monthLabel}`}
        actions={<MonthSelector month={month} onChange={onMonthChange} />}
      />

      {future && (
        <section className="panel empty-state">
          <CalendarDays size={36} strokeWidth={1.5} aria-hidden="true" />
          <h2>{monthLabel} hasn’t started yet</h2>
          <p>Insights describe spending you’ve already recorded. Choose the current month or an earlier one.</p>
          <Button variant="primary" onClick={() => onMonthChange(getCurrentMonth())}>
            Go to this month
          </Button>
        </section>
      )}
      {!future && data.status === "loading" && <LoadingPanel label="Loading insights…" />}
      {!future && data.status === "error" && <InlineError message={data.message} onRetry={data.retry} />}
      {data.status === "ready" && data.data && (
        <InsightsContent insights={data.data} onAddExpense={() => openAdd("EXPENSE")} />
      )}
    </>
  );
}

function InsightsContent({ insights, onAddExpense }: { insights: Insights; onAddExpense: () => void }) {
  const monthLabel = formatMonthYear(insights.month);
  const hasActivity = insights.trend.some((m) => m.hasActivity);

  return (
    <>
      <div className="insight-lookback">
        <CalendarDays size={16} aria-hidden="true" />
        <span>
          {monthLabel}
          {insights.partialMonth ? " so far" : ""}: {formatRange(insights.periodStart, insights.asOf)} ·{" "}
          {plural(insights.spendingDays, "spending day", "spending days")}. Repeated categories look back 90 days (
          {formatRange(insights.lookbackStart, insights.lookbackEnd)}).
        </span>
      </div>

      {insights.insufficientHistory && (
        <section className="panel empty-state" aria-labelledby="insufficient-heading">
          <ChartNoAxesCombined size={36} strokeWidth={1.5} aria-hidden="true" />
          <span className="status-badge">
            {insights.spendingDays} of {insights.minimumSpendingDays} spending days
          </span>
          <h2 id="insufficient-heading">Not enough history for {monthLabel} yet</h2>
          <p>
            Month observations appear once you’ve recorded spending on at least {insights.minimumSpendingDays} different days.
            Until then, nothing here is presented as a pattern.
          </p>
          <Button variant="primary" onClick={onAddExpense}>
            <Plus size={16} aria-hidden="true" />
            Add expense
          </Button>
        </section>
      )}

      {insights.observations.length > 0 && (
        <section aria-labelledby="observations-heading">
          <div className="section-heading">
            <h2 id="observations-heading">Observations</h2>
            <span className="subtle-tag">{plural(insights.observations.length, "observation", "observations")}</span>
          </div>
          <div className="insights-cards">
            {insights.observations.map((o) => (
              <ObservationCard
                key={o.type === "REPEATED_CATEGORY" ? `${o.type}-${o.categoryId}` : "group" in o ? `${o.type}-${o.group}` : o.type}
                observation={o}
                insights={insights}
              />
            ))}
          </div>
        </section>
      )}

      {!insights.insufficientHistory && insights.observations.length === 0 && (
        <section className="panel empty-state">
          <ChartNoAxesCombined size={36} strokeWidth={1.5} aria-hidden="true" />
          <h2>Nothing stands out for {monthLabel}</h2>
          <p>None of your groups went over plan and no observation met its threshold. Your figures are below.</p>
        </section>
      )}

      {hasActivity && (
        <div className="charts-grid">
          <SpendingTrendChart insights={insights} />
          <GroupShareChart insights={insights} />
        </div>
      )}
    </>
  );
}
