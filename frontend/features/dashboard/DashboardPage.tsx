"use client";

import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { InlineError } from "@/components/feedback/InlineError";
import { LoadingPanel } from "@/components/feedback/LoadingPanel";
import { MonthSelector } from "@/components/financial/MonthSelector";
import { useAppShell } from "@/components/layout/AppShellContext";
import { PageHeading } from "@/components/layout/PageHeading";
import { Button } from "@/components/ui/Button";
import { TransactionRows } from "@/features/transactions/TransactionRows";
import { getDashboard } from "@/lib/api/dashboard";
import { listTransactions } from "@/lib/api/transactions";
import { useAuth } from "@/lib/auth/AuthProvider";
import { displayNameFor } from "@/lib/auth/displayName";
import { formatMonthYear, getMonthDateRange } from "@/lib/formatting/dates";
import { useApiData } from "@/lib/useApiData";
import { FreshMonthNotice } from "./FreshMonthNotice";
import { GroupProgressCard } from "./GroupProgressCard";
import { PlanSummary } from "./PlanSummary";
import { SummaryCards } from "./SummaryCards";

const RECENT_COUNT = 5;

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

  const name = displayNameFor(user?.email);
  const monthLabel = formatMonthYear(month);
  const budgetHref = `/budget?month=${month}`;

  return (
    <>
      <PageHeading
        dashboard
        title={name ? `Welcome back, ${name}` : "Dashboard"}
        actions={
          <>
            <MonthSelector month={month} onChange={onMonthChange} />
            <Button variant="primary" onClick={() => openAdd("EXPENSE")}>
              <Plus size={17} aria-hidden="true" />
              Add expense
            </Button>
            <Button variant="ghost" className="dashboard-income-action" onClick={() => openAdd("INCOME")}>
              <Plus size={17} aria-hidden="true" />
              Add income
            </Button>
          </>
        }
      />

      {data.status === "loading" && <LoadingPanel label="Loading dashboard…" />}
      {data.status === "error" && <InlineError message={data.message} onRetry={data.retry} />}
      {data.status === "ready" && (
        <>
          <FreshMonthNotice dashboard={data.data.dashboard} monthLabel={monthLabel} budgetHref={budgetHref} onAddIncome={() => openAdd("INCOME")} />
          <SummaryCards dashboard={data.data.dashboard} />

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

          <div className="dashboard-lower">
            <section className="recent-section panel" aria-labelledby="recent-heading">
              <div className="section-heading panel-heading">
                <h2 id="recent-heading">Recent transactions</h2>
                <Link className="text-button" href={`/transactions?month=${month}`}>
                  View all <ArrowRight size={15} aria-hidden="true" />
                </Link>
              </div>
              <TransactionRows
                transactions={data.data.recent}
                onOpen={openTransaction}
                empty={
                  <div className="empty-state">
                    <h3>No transactions in {monthLabel}</h3>
                    <p>Expenses and income you record for this month appear here.</p>
                    <Button variant="primary" onClick={() => openAdd()}>
                      <Plus size={16} aria-hidden="true" />
                      Add transaction
                    </Button>
                  </div>
                }
              />
            </section>
            <div className="dashboard-side">
              <PlanSummary dashboard={data.data.dashboard} budgetHref={budgetHref} />
            </div>
          </div>
        </>
      )}
    </>
  );
}
