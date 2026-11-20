"use client";

import { TriangleAlert, Wallet } from "lucide-react";
import { InlineError } from "@/components/feedback/InlineError";
import { LoadingPanel } from "@/components/feedback/LoadingPanel";
import { GROUP_ORDER } from "@/components/financial/groups";
import { MonthSelector } from "@/components/financial/MonthSelector";
import { useAppShell } from "@/components/layout/AppShellContext";
import { PageHeading } from "@/components/layout/PageHeading";
import { getDashboard } from "@/lib/api/dashboard";
import { amountDigits } from "@/lib/formatting/decimal";
import { formatMonthYear } from "@/lib/formatting/dates";
import { useApiData } from "@/lib/useApiData";
import { BudgetSaveBar } from "./BudgetSaveBar";
import { BudgetTotals } from "./BudgetTotals";
import { GroupAllocationCard } from "./GroupAllocationCard";
import { useBudgetForm } from "./useBudgetForm";

/**
 * BUDGET-001/002. Over-allocation warns but never blocks saving (DEC-012).
 */
export function BudgetPage({ month, onMonthChange }: { month: string; onMonthChange: (m: string) => void }) {
  const { notify, dataVersion } = useAppShell();
  const { formRef, ...form } = useBudgetForm(month, notify);
  // Spending per group comes from the dashboard aggregate; the plan form works without it.
  const spending = useApiData(() => getDashboard(month), [month, dataVersion, form.saved], "");
  const spentByGroup = spending.status === "ready" ? new Map(spending.data.groups.map((g) => [g.group, g])) : null;
  const monthLabel = formatMonthYear(month);
  const { figures } = form;

  return (
    <>
      <div className="budget-header-wrap flex items-start justify-between gap-4 mb-4">
        <div>
          <span className="text-[11px] font-bold tracking-[0.2em] text-[#34d399] uppercase block mb-1">
            PLAN WITH PURPOSE
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Budgets & savings</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Give every category a comfortable limit and keep your next goal visible.
          </p>
        </div>
        <MonthSelector month={month} onChange={onMonthChange} />
      </div>

      <div className="sr-only">
        <PageHeading
          title="Monthly budget"
          subtitle={form.saved ? `Plan for ${monthLabel}` : `No plan saved for ${monthLabel} yet`}
        />
      </div>

      {form.load.status === "loading" && <LoadingPanel label="Loading your plan…" />}
      {form.load.status === "error" && <InlineError message={form.load.message} onRetry={form.retry} />}
      {form.load.status === "ready" && (
        <form ref={formRef} onSubmit={form.submit} noValidate aria-busy={form.saving}>
          {form.saveError && <InlineError message={form.saveError} />}

          {!form.saved && (
            <div className="budget-empty-boundary-card bg-[#0d1611] border border-white/[0.07] rounded-3xl p-8 text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-[#13271c] border border-emerald-500/20 text-[#34d399] flex items-center justify-center mx-auto mb-3 shadow-md">
                <Wallet size={26} strokeWidth={2.2} />
              </div>
              <h3 className="text-lg font-semibold text-white">Create a spending boundary</h3>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-sm mx-auto">
                Add a category budget to start tracking your monthly progress.
              </p>
            </div>
          )}

          <BudgetTotals
            values={form.values}
            fieldErrors={form.fieldErrors}
            disabled={form.saving}
            figures={figures}
            figuresNote={form.figuresNote}
            onChange={form.setField}
          />

          <div className="section-heading mt-6 mb-3">
            <div>
              <span className="text-[10px] font-bold tracking-[0.2em] text-[#34d399] uppercase block mb-0.5">
                MONTHLY PLAN
              </span>
              <h2>Category budgets</h2>
            </div>
            <span className="subtle-tag">{monthLabel}</span>
          </div>
          <div className="sr-only">
            <h2>Group allocations</h2>
          </div>
          <div className="editable-budget-grid">
            {GROUP_ORDER.map((group) => (
              <GroupAllocationCard
                key={group}
                group={group}
                value={form.values.allocations[group]}
                error={form.fieldErrors[`allocations.${group}`]}
                disabled={form.saving}
                spending={spentByGroup?.get(group) ?? null}
                hasSavedPlan={form.saved !== null}
                onChange={(v) => form.setAllocation(group, v)}
              />
            ))}
          </div>

          {figures?.overAllocated && (
            <div className="inline-warning" role="status">
              <TriangleAlert size={20} aria-hidden="true" />
              <p>
                Your savings target and allocations are LKR {amountDigits(figures.overAllocationAmount)} above your planned
                income. You can still save this plan and adjust it later.
              </p>
            </div>
          )}

          <BudgetSaveBar
            plannedTotal={figures?.plannedTotal ?? null}
            saving={form.saving}
            unchanged={form.unchanged}
            onReset={form.reset}
          />
        </form>
      )}
    </>
  );
}
