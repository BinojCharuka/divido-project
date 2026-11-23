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
      <div className="insights-header-wrap flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 mb-4">
        <div>
          <span className="text-[11px] font-bold tracking-[0.2em] text-[#34d399] uppercase block mb-1">
            FINANCIAL PATTERNS
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Insights & analytics</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">A calm, clear view of how your money has moved over time.</p>
        </div>
        <div className="flex items-center justify-start sm:justify-end w-full sm:w-auto">
          <MonthSelector month={month} onChange={onMonthChange} />
        </div>
      </div>

      <div className="sr-only">
        <PageHeading
          title="Spending insights"
          subtitle={`What your records show for ${monthLabel}`}
        />
      </div>

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
        <div className="animate-content-reveal">
          <InsightsContent insights={data.data} onAddExpense={() => openAdd("EXPENSE")} />
        </div>
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
        <section className="panel empty-state text-center py-12" aria-labelledby="insufficient-heading">
          <div className="w-14 h-14 rounded-2xl bg-[#13271c] border border-emerald-500/20 text-[#34d399] flex items-center justify-center mx-auto mb-3 shadow-md">
            <ChartNoAxesCombined size={26} strokeWidth={2.2} />
          </div>
          <h2 className="text-lg font-semibold text-white">Insights need a little history</h2>
          <h2 id="insufficient-heading" className="sr-only">
            Not enough history for {monthLabel} yet
          </h2>
          <span className="status-badge inline-block mt-1 mb-2">
            {insights.spendingDays} of {insights.minimumSpendingDays} spending days
          </span>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-sm mx-auto">
            Your trends and category breakdown will build automatically as you record transactions.
          </p>
          <div className="mt-5 flex justify-center">
            <Button variant="primary" onClick={onAddExpense} className="bg-[#10b981] hover:bg-[#059669] text-white">
              <Plus size={16} aria-hidden="true" />
              Add expense
            </Button>
          </div>
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
