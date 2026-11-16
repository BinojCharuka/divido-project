"use client";

import { TriangleAlert } from "lucide-react";
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
      <PageHeading
        title="Monthly budget"
        subtitle={form.saved ? `Plan for ${monthLabel}` : `No plan saved for ${monthLabel} yet`}
        actions={<MonthSelector month={month} onChange={onMonthChange} />}
      />

      {form.load.status === "loading" && <LoadingPanel label="Loading your plan…" />}
      {form.load.status === "error" && <InlineError message={form.load.message} onRetry={form.retry} />}
      {form.load.status === "ready" && (
        <form ref={formRef} onSubmit={form.submit} noValidate aria-busy={form.saving}>
          {form.saveError && <InlineError message={form.saveError} />}
          <BudgetTotals
            values={form.values}
            fieldErrors={form.fieldErrors}
            disabled={form.saving}
            figures={figures}
            figuresNote={form.figuresNote}
            onChange={form.setField}
          />

          <div className="section-heading">
            <h2>Group allocations</h2>
            <span className="subtle-tag">{monthLabel}</span>
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
