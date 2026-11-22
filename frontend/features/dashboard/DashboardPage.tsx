"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, ChartNoAxesCombined, Plus } from "lucide-react";
import { InlineError } from "@/components/feedback/InlineError";
import { LoadingPanel } from "@/components/feedback/LoadingPanel";
import { MonthSelector } from "@/components/financial/MonthSelector";
import { useAppShell } from "@/components/layout/AppShellContext";
import { Button } from "@/components/ui/Button";
import { TransactionRows } from "@/features/transactions/TransactionRows";
import { getDashboard } from "@/lib/api/dashboard";
import { listTransactions } from "@/lib/api/transactions";
import { useAuth } from "@/lib/auth/AuthProvider";
import { displayNameFor } from "@/lib/auth/displayName";
import { formatMonthYear, getMonthDateRange, getTimeGreeting } from "@/lib/formatting/dates";
import { useApiData } from "@/lib/useApiData";
import { FreshMonthNotice } from "./FreshMonthNotice";
import { GroupProgressCard } from "./GroupProgressCard";
import { PlanSummary } from "./PlanSummary";
import { SummaryCards } from "./SummaryCards";

const RECENT_COUNT = 5;
const RECENT_DISPLAY_LIMIT = 3;

/**
 * DASH-001. Every figure comes from the backend; this page only lays them out.
 * Without a plan the planned figures stay empty instead of showing zeros (DEC-028).
 */
export function DashboardPage({ month, onMonthChange }: { month: string; onMonthChange: (m: string) => void }) {
  const { user } = useAuth();
  const { openAdd, openTransaction, dataVersion } = useAppShell();
  const data = useApiData(
    async () => {
      const { from, to } = getMonthDateRange(month);
      const [dashboard, recent] = await Promise.all([getDashboard(month), listTransactions({ from, to, page: 0, size: RECENT_COUNT })]);
      return { dashboard, recent: recent.items };
    },
    [month, dataVersion],
    "We couldn't load your dashboard. Check your connection and try again.",
  );

  const name = displayNameFor(user);
  const monthLabel = formatMonthYear(month);
  const budgetHref = `/budget?month=${month}`;

  const [greeting, setGreeting] = useState(() => getTimeGreeting());

  useEffect(() => {
    setGreeting(getTimeGreeting());
    const timer = setInterval(() => {
      setGreeting(getTimeGreeting());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const greetingHeading = name ? `${greeting}, ${name}` : `${greeting}, ready to plan?`;

  const readyData = data.status === "ready" ? data.data : undefined;
  const displayedRecent = readyData ? readyData.recent.slice(0, RECENT_DISPLAY_LIMIT) : [];
  const totalTransactions = readyData
    ? (readyData.dashboard.expenseTransactionCount ?? 0) + (readyData.dashboard.incomeTransactionCount ?? 0)
    : 0;
  const hasMore = readyData
    ? totalTransactions > displayedRecent.length || readyData.recent.length > displayedRecent.length
    : false;

  return (
    <>
      {data.status === "loading" && <LoadingPanel label="Loading dashboard…" />}
      {data.status === "error" && <InlineError message={data.message} onRetry={data.retry} />}
      {data.status === "ready" && (
        <>
          <FreshMonthNotice dashboard={data.data.dashboard} monthLabel={monthLabel} budgetHref={budgetHref} onAddIncome={() => openAdd("INCOME")} />
          
          {/* Compact greeting placed on page background ABOVE the black frame/card on mobile */}
          <div className="dashboard-greeting-compact md:hidden mb-4 px-0.5">
            <span className="text-[10px] font-bold tracking-[0.2em] text-[#34d399] uppercase block leading-none mb-1">
              OVERVIEW
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {greetingHeading}
            </h1>
          </div>

          <div className="dashboard-reference-frame">
            <div className="dashboard-reference-header sr-only">
              <div>
                <span className="text-[11px] font-bold tracking-[0.2em] text-[#34d399] uppercase block mb-1">
                  OVERVIEW
                </span>
                <h1 className="dashboard-reference-greeting text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  {greetingHeading}
                </h1>
              </div>
              <div className="dashboard-reference-controls">
                <div className="dashboard-reference-month-control">
                  <MonthSelector month={month} onChange={onMonthChange} />
                </div>
                <div className="dashboard-header-buttons desktop-only">
                  <Button variant="destructive" onClick={() => openAdd("EXPENSE")}>
                    <Plus size={15} aria-hidden="true" />
                    Add expense
                  </Button>
                  <Button variant="primary" onClick={() => openAdd("INCOME")}>
                    <Plus size={15} aria-hidden="true" />
                    Add income
                  </Button>
                </div>
              </div>
            </div>
            <SummaryCards
              dashboard={data.data.dashboard}
              monthLabel={monthLabel}
              month={month}
              onAddExpense={() => openAdd("EXPENSE")}
              onAddRecord={() => openAdd()}
            />

            <section className="budget-section" aria-labelledby="breakdown-heading">
              <div className="section-heading">
                <h2 id="breakdown-heading">
                  Group breakdown <span className="subtle-tag">{monthLabel}</span>
                </h2>
                <Link className="text-button" href={budgetHref}>
                  {data.data.dashboard.hasBudget ? "Manage plan" : "Plan this month"} <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>
              <div className="budget-grid">
                {data.data.dashboard.groups.map((g) => (
                  <GroupProgressCard key={g.group} group={g} href={budgetHref} />
                ))}
              </div>
            </section>
          </div>

          <div className="dashboard-lower">
            <section className="recent-section panel" aria-labelledby="recent-heading">
              <div className="section-heading panel-heading">
                <div>
                  <span className="text-[10px] font-bold tracking-[0.2em] text-[#34d399] uppercase block mb-0.5">
                    ACTIVITY
                  </span>
                  <h2 id="recent-heading">Recent transactions</h2>
                </div>
                <Link className="text-button flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#34d399] hover:underline py-1 px-2 rounded-md hover:bg-emerald-500/10 transition-colors" href={`/transactions?month=${month}`}>
                  <span>View all</span>
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
              <TransactionRows
                transactions={displayedRecent}
                onOpen={openTransaction}
                empty={
                  <div className="empty-state text-center py-8">
                    <div className="w-12 h-12 rounded-2xl bg-[#14261d] border border-emerald-500/20 text-[#34d399] flex items-center justify-center mx-auto mb-3 shadow-sm">
                      <Plus size={22} strokeWidth={2.2} />
                    </div>
                    <h3 className="text-base font-semibold text-white">No transactions this month</h3>
                    <span className="sr-only">No transactions in {monthLabel}</span>
                    <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                      Record your first income or expense to see your balance come alive.
                    </p>
                    <div className="mt-4 flex justify-center">
                      <Button variant="primary" onClick={() => openAdd()} className="bg-[#10b981] hover:bg-[#059669] text-white">
                        <Plus size={16} aria-hidden="true" />
                        Add transaction
                      </Button>
                    </div>
                  </div>
                }
              />
              {displayedRecent.length > 0 && (
                <div className="border-t border-white/[0.08] px-4 sm:px-5 py-3.5 flex items-center justify-between flex-wrap gap-2.5">
                  <span className="text-xs text-zinc-400">
                    {hasMore
                      ? `Showing latest ${displayedRecent.length} of ${totalTransactions > displayedRecent.length ? totalTransactions : data.data.recent.length} records`
                      : `Showing ${displayedRecent.length} record${displayedRecent.length === 1 ? "" : "s"}`}
                  </span>
                  <Link
                    href={`/transactions?month=${month}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#14261d] hover:bg-[#1b3528] border border-emerald-500/20 text-xs font-semibold text-[#34d399] hover:text-emerald-300 transition-all shadow-xs"
                  >
                    <span>View all in History</span>
                    <ArrowRight size={13} aria-hidden="true" />
                  </Link>
                </div>
              )}
            </section>
            <div className="dashboard-side">
              <PlanSummary dashboard={data.data.dashboard} budgetHref={budgetHref} />
              <div className="dashboard-shortcuts panel" aria-label="Explore insights and monthly reflection">
                <Link className="dashboard-shortcut-item" href={`/insights?month=${month}`}>
                  <span className="group-icon" aria-hidden="true">
                    <ChartNoAxesCombined size={18} />
                  </span>
                  <div>
                    <strong>Spending insights</strong>
                    <span>Explore observations and patterns</span>
                  </div>
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
                <Link className="dashboard-shortcut-item" href={`/reflection?month=${month}`}>
                  <span className="group-icon" aria-hidden="true">
                    <BookOpen size={18} />
                  </span>
                  <div>
                    <strong>Monthly reflection</strong>
                    <span>Review habits and write answers</span>
                  </div>
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
