"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { FormAlert } from "@/components/feedback/FormAlert";
import { Skeleton, TransactionListSkeleton } from "@/components/feedback/LoadingSkeleton";
import { KakeiboGroupBadge } from "@/components/financial/KakeiboGroupBadge";
import { MoneyAmount } from "@/components/financial/MoneyAmount";
import { MonthNavigator } from "@/components/financial/MonthNavigator";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TransactionRow } from "@/features/transactions/TransactionRow";
import { ApiError } from "@/lib/api/client";
import { getDashboard } from "@/lib/api/dashboard";
import { listTransactions } from "@/lib/api/transactions";
import { absAmount, GROUP_LABELS } from "@/lib/budget/plan";
import { formatMonthYear, getMonthDateRange } from "@/lib/formatting/dates";
import type { Dashboard, DashboardGroup } from "@/types/budget";
import type { Transaction } from "@/types/transaction";

export interface DashboardViewProps {
  month: string;
  onMonthChange: (month: string) => void;
}

const RECENT_COUNT = 5;

type Load<T> = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: T };

function errorMessage(error: unknown, what: string): string {
  if (error instanceof ApiError && error.kind === "network") return error.message;
  return `We couldn't load ${what}. Please try again.`;
}

export function DashboardView({ month, onMonthChange }: DashboardViewProps) {
  const [dashboard, setDashboard] = useState<Load<Dashboard>>({ status: "loading" });
  const [recent, setRecent] = useState<Load<Transaction[]>>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setDashboard({ status: "loading" });
      try {
        const data = await getDashboard(month);
        if (active) setDashboard({ status: "ready", data });
      } catch (error) {
        if (active) setDashboard({ status: "error", message: errorMessage(error, "your dashboard") });
      }
    }

    // Recent activity reuses the existing transactions API (DIV-017: not embedded in DASH-001).
    async function loadRecent() {
      setRecent({ status: "loading" });
      try {
        const { from, to } = getMonthDateRange(month);
        const page = await listTransactions({ from, to, page: 0, size: RECENT_COUNT });
        if (active) setRecent({ status: "ready", data: page.items });
      } catch (error) {
        if (active) setRecent({ status: "error", message: errorMessage(error, "recent transactions") });
      }
    }

    void loadDashboard();
    void loadRecent();
    return () => {
      active = false;
    };
  }, [month, reloadKey]);

  const monthLabel = formatMonthYear(month);
  const retry = () => setReloadKey((k) => k + 1);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Your plan for the month beside what you have actually recorded."
        action={<MonthNavigator month={month} onChange={onMonthChange} />}
      />

      {dashboard.status === "loading" ? (
        <div className="flex flex-col gap-4" aria-busy="true">
          <p className="sr-only" role="status">
            Loading dashboard for {monthLabel}…
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-44 w-full rounded-xl" />
            <Skeleton className="h-44 w-full rounded-xl" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-40 w-full rounded-xl" />
            ))}
          </div>
        </div>
      ) : dashboard.status === "error" ? (
        <div className="flex flex-col gap-3">
          <FormAlert tone="error">{dashboard.message}</FormAlert>
          <Button variant="secondary" size="sm" className="self-start" onClick={retry}>
            Try again
          </Button>
        </div>
      ) : (
        <DashboardContent data={dashboard.data} monthLabel={monthLabel} />
      )}

      <section aria-labelledby="recent-heading" className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="recent-heading" className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Recent transactions in {monthLabel}
          </h2>
          <Link
            href="/transactions"
            className="text-sm font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
          >
            All transactions
          </Link>
        </div>
        {recent.status === "loading" ? (
          <TransactionListSkeleton count={3} />
        ) : recent.status === "error" ? (
          <div className="flex flex-col gap-3">
            <FormAlert tone="error">{recent.message}</FormAlert>
            <Button variant="secondary" size="sm" className="self-start" onClick={retry}>
              Try again
            </Button>
          </div>
        ) : recent.data.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
            No transactions recorded in {monthLabel}.{" "}
            <Link href="/transactions/new-expense" className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400">
              Record an expense
            </Link>{" "}
            or{" "}
            <Link href="/transactions/new-income" className="font-semibold text-emerald-700 hover:underline dark:text-emerald-400">
              record income
            </Link>
            .
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xs dark:divide-zinc-800/80 dark:border-zinc-800 dark:bg-zinc-900">
            {recent.data.map((t) => (
              <TransactionRow key={t.id} transaction={t} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function DashboardContent({ data, monthLabel }: { data: Dashboard; monthLabel: string }) {
  const noActivity = data.incomeTransactionCount === 0 && data.expenseTransactionCount === 0;
  const budgetHref = `/budget?month=${data.month}`;

  return (
    <div className="flex flex-col gap-6">
      {!data.hasBudget && (
        <div className="flex flex-col gap-3 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/60 p-5 sm:flex-row sm:items-center sm:justify-between dark:border-emerald-800 dark:bg-emerald-950/30">
          <div>
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">No budget for {monthLabel}</h2>
            <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
              {noActivity
                ? "Nothing is planned or recorded for this month yet. Start with a plan, then record your spending."
                : "Your recorded transactions are shown below. Create a plan to compare them with group budgets."}
            </p>
          </div>
          <Link
            href={budgetHref}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white outline-none hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            Create budget
          </Link>
        </div>
      )}

      {data.overAllocated && data.overAllocationAmount && (
        <FormAlert tone="warning">
          Your plan for {monthLabel} exceeds planned income by{" "}
          <MoneyAmount amount={data.overAllocationAmount} className="font-semibold !text-current" />: savings target
          plus group budgets is <MoneyAmount amount={data.plannedTotal ?? "0"} className="!text-current" />, planned
          income is <MoneyAmount amount={data.plannedIncome ?? "0"} className="!text-current" />.{" "}
          <Link href={budgetHref} className="font-semibold underline">
            Adjust budget
          </Link>
        </FormAlert>
      )}

      <section aria-labelledby="overview-heading">
        <h2 id="overview-heading" className="sr-only">
          Monthly overview for {monthLabel}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <SummaryHeading tag="Planned" title="Your plan" detail={data.hasBudget ? "From your monthly budget" : "No budget saved"} />
            <dl className="mt-4 flex flex-col gap-3">
              <Figure label="Planned income" value={data.plannedIncome} />
              <Figure label="Savings target" value={data.savingsTarget} />
              <Figure label="Group budgets total" value={data.allocationTotal} />
            </dl>
            {data.hasBudget && (
              <Link href={budgetHref} className="mt-4 inline-block text-sm font-medium text-emerald-700 hover:underline dark:text-emerald-400">
                Edit budget
              </Link>
            )}
          </Card>
          <Card>
            <SummaryHeading tag="Recorded" title="What happened" detail="From your transactions" />
            <dl className="mt-4 flex flex-col gap-3">
              <Figure
                label="Recorded income"
                value={data.recordedIncome}
                note={
                  data.incomeTransactionCount === 0 ? (
                    <Link href="/transactions/new-income" className="font-medium text-emerald-700 hover:underline dark:text-emerald-400">
                      No income recorded yet — record income
                    </Link>
                  ) : (
                    `${data.incomeTransactionCount} ${data.incomeTransactionCount === 1 ? "entry" : "entries"}`
                  )
                }
              />
              <Figure
                label="Spent"
                value={data.totalSpent}
                note={
                  data.expenseTransactionCount === 0 ? (
                    <Link href="/transactions/new-expense" className="font-medium text-emerald-700 hover:underline dark:text-emerald-400">
                      No expenses recorded yet — record an expense
                    </Link>
                  ) : (
                    `${data.expenseTransactionCount} ${data.expenseTransactionCount === 1 ? "expense" : "expenses"}`
                  )
                }
              />
            </dl>
          </Card>
        </div>
      </section>

      <section aria-labelledby="groups-heading">
        <h2 id="groups-heading" className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Kakeibo groups: budget vs spent
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data.groups.map((g) => (
            <li key={g.group}>
              <GroupCard group={g} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function SummaryHeading({ tag, title, detail }: { tag: "Planned" | "Recorded"; title: string; detail: string }) {
  const tagStyle =
    tag === "Planned"
      ? "bg-indigo-50 text-indigo-800 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800"
      : "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800";
  return (
    <div>
      <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${tagStyle}`}>
        {tag}
      </span>
      <h3 className="mt-2 text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{detail}</p>
    </div>
  );
}

function Figure({ label, value, note }: { label: string; value: string | null; note?: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-sm text-zinc-600 dark:text-zinc-400">{label}</dt>
      <dd>
        {value === null ? (
          <span className="text-base font-medium text-zinc-500 dark:text-zinc-400">Not set</span>
        ) : (
          <MoneyAmount amount={value} size="lg" />
        )}
        {note && <span className="block text-xs text-zinc-500 dark:text-zinc-400">{note}</span>}
      </dd>
    </div>
  );
}

function GroupCard({ group }: { group: DashboardGroup }) {
  const label = GROUP_LABELS[group.group];
  const hasBudget = group.budget !== null;
  const percent = group.percentUsed === null ? null : Number(group.percentUsed);
  const over = group.overBudget === true;

  return (
    <Card className="h-full flex flex-col gap-3" role="group" aria-label={`${label} group`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          <KakeiboGroupBadge group={group.group} size="md" />
        </h3>
        {over && (
          <span className="rounded-md bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-950/60 dark:text-red-300">
            Over budget
          </span>
        )}
      </div>

      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex items-baseline justify-between gap-2">
          <dt className="text-zinc-600 dark:text-zinc-400">Spent (recorded)</dt>
          <dd>
            <MoneyAmount amount={group.spent} className="font-semibold" />
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <dt className="text-zinc-600 dark:text-zinc-400">Budget (planned)</dt>
          <dd>{hasBudget ? <MoneyAmount amount={group.budget as string} /> : <span className="text-zinc-500">Not set</span>}</dd>
        </div>
      </dl>

      {percent !== null ? (
        <div>
          <div
            role="progressbar"
            aria-label={`${label} budget used`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.min(percent, 100)}
            aria-valuetext={`${group.percentUsed}% of the ${label} budget used`}
            className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
          >
            <div
              className={`h-full rounded-full ${over ? "bg-red-600" : percent >= 90 ? "bg-amber-500" : "bg-emerald-600"}`}
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{group.percentUsed}% used</p>
        </div>
      ) : hasBudget ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">No budget allocated to this group, so no percentage is shown.</p>
      ) : null}

      <div className="mt-auto border-t border-zinc-100 pt-2 text-sm dark:border-zinc-800">
        {group.remaining === null ? (
          <span className="text-zinc-500 dark:text-zinc-400">Remaining: no budget set</span>
        ) : over ? (
          <span className="font-semibold text-red-700 dark:text-red-400">
            Over by <MoneyAmount amount={absAmount(group.remaining)} className="!text-current font-semibold" />
          </span>
        ) : (
          <span className="text-zinc-700 dark:text-zinc-300">
            Remaining <MoneyAmount amount={group.remaining} className="font-semibold" />
          </span>
        )}
      </div>
    </Card>
  );
}
