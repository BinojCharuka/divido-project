"use client";

import { Target, TriangleAlert, Wallet } from "lucide-react";
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
      <div className="budget-header-wrap flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 mb-4">
        <div>
          <span className="text-[11px] font-bold tracking-[0.2em] text-[#34d399] uppercase block mb-1">
            PLAN WITH PURPOSE
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">Budgets & savings</h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Give every category a comfortable limit and keep your next goal visible.
          </p>
        </div>
        <div className="flex items-center justify-start sm:justify-end w-full sm:w-auto">
          <MonthSelector month={month} onChange={onMonthChange} />
        </div>
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
        <div className="animate-content-reveal">
          <form ref={formRef} onSubmit={form.submit} noValidate aria-busy={form.saving}>
          {form.saveError && <InlineError message={form.saveError} />}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Category budgets & Group Allocations */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
              {!form.saved && (
                <div className="budget-empty-boundary-card bg-[#0d1611] border border-white/[0.07] rounded-3xl p-8 text-center">
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

              <div className="section-heading mt-2 mb-1">
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
            </div>

            {/* Right Column: Desktop Budget Limit & Savings Goal Cards matching screenshot 3 */}
            <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-5">
              {/* Card 1: BUDGET LIMIT */}
              <div className="bg-[#0d1611] border border-white/[0.07] rounded-3xl p-6 shadow-lg">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase block">
                      BUDGET LIMIT
                    </span>
                    <h3 className="text-base font-semibold text-white mt-0.5">
                      Add or update category
                    </h3>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-[#13271c] border border-emerald-500/20 text-[#34d399] flex items-center justify-center">
                    <Wallet size={18} strokeWidth={2.2} />
                  </div>
                </div>

                <div className="flex flex-col gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Category</label>
                    <select
                      className="w-full bg-[#0f1c15] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-zinc-200 focus:outline-hidden focus:border-emerald-500/50"
                      defaultValue="NEEDS"
                      onChange={(e) => {
                        const val = form.values.allocations[e.target.value as keyof typeof form.values.allocations];
                        if (val !== undefined) form.setAllocation(e.target.value as keyof typeof form.values.allocations, val);
                      }}
                    >
                      <option value="NEEDS">Needs · Living essentials</option>
                      <option value="WANTS">Wants · Comfort & leisure</option>
                      <option value="CULTURE">Culture · Learning & events</option>
                      <option value="UNEXPECTED">Unexpected · Unplanned expenses</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Monthly limit</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs font-bold text-[#34d399] pointer-events-none">LKR</span>
                      <input
                        type="number"
                        placeholder="0"
                        className="w-full bg-[#0f1c15] border border-white/10 rounded-xl pl-12 pr-4 py-2.5 text-sm text-zinc-200 focus:outline-hidden focus:border-emerald-500/50"
                        defaultValue="0"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 py-3 rounded-xl bg-[#141f17] hover:bg-[#1a2c20] text-zinc-200 border border-white/10 text-xs font-semibold cursor-pointer transition-colors shadow-xs"
                  >
                    Save category budget
                  </button>
                </div>
              </div>

              {/* Card 2: SAVINGS GOAL */}
              <div className="bg-[#0d1611] border border-white/[0.07] rounded-3xl p-6 shadow-lg">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase block">
                      SAVINGS GOAL
                    </span>
                    <h3 className="text-base font-semibold text-white mt-0.5">
                      Track your progress
                    </h3>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-[#13271c] border border-emerald-500/20 text-[#34d399] flex items-center justify-center">
                    <Target size={18} strokeWidth={2.2} />
                  </div>
                </div>

                <div className="flex flex-col gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Goal name</label>
                    <input
                      type="text"
                      placeholder="e.g. Emergency fund"
                      className="w-full bg-[#0f1c15] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-hidden focus:border-emerald-500/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">Target</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={form.values.savingsTarget || ""}
                        onChange={(e) => form.setField("savingsTarget", e.target.value)}
                        className="w-full bg-[#0f1c15] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-zinc-200 focus:outline-hidden focus:border-emerald-500/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1.5">Saved</label>
                      <input
                        type="number"
                        placeholder="0"
                        defaultValue="0"
                        className="w-full bg-[#0f1c15] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-zinc-200 focus:outline-hidden focus:border-emerald-500/50"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 py-3 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white text-xs font-semibold cursor-pointer transition-colors shadow-md shadow-emerald-500/20"
                  >
                    Update savings target
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
      )}
    </>
  );
}
