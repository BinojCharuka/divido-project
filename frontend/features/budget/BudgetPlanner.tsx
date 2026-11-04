"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { FormAlert } from "@/components/feedback/FormAlert";
import { Skeleton } from "@/components/feedback/LoadingSkeleton";
import { MonthNavigator } from "@/components/financial/MonthNavigator";
import { MoneyAmount } from "@/components/financial/MoneyAmount";
import { MoneyInput } from "@/components/forms/MoneyInput";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useFocusFirstInvalid } from "@/features/auth/useFocusFirstInvalid";
import { getBudget, saveBudget } from "@/lib/api/budgets";
import { ApiError } from "@/lib/api/client";
import {
  absAmount,
  BUDGET_GROUPS,
  emptyBudgetForm,
  formFromBudget,
  GROUP_LABELS,
  previewPlan,
  toBudgetInput,
  toCents,
  validateBudgetForm,
  type BudgetFieldErrors,
  type BudgetFormValues,
} from "@/lib/budget/plan";
import { formatMonthYear } from "@/lib/formatting/dates";
import { cleanNumberString } from "@/lib/formatting/money";
import type { MonthlyBudget } from "@/types/budget";
import { KAKEIBO_GROUPS, type KakeiboGroup } from "@/types/category";

export interface BudgetPlannerProps {
  month: string;
  onMonthChange: (month: string) => void;
}

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "ready" };

function sameAsSaved(values: BudgetFormValues, saved: MonthlyBudget | null): boolean {
  if (!saved) return false;
  const eq = (a: string, b: string) => {
    const left = toCents(a);
    return left !== null && left === toCents(b);
  };
  return (
    eq(values.plannedIncome, saved.plannedIncome) &&
    eq(values.savingsTarget, saved.savingsTarget) &&
    BUDGET_GROUPS.every((g) => eq(values.allocations[g], saved.allocations[g]))
  );
}

function loadErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.kind === "network") return error.message;
  return "We couldn't load your budget for this month. Please try again.";
}

const GROUP_HINTS: Record<KakeiboGroup, string> = Object.fromEntries(
  KAKEIBO_GROUPS.map((g) => [g.id, g.description]),
) as Record<KakeiboGroup, string>;

export function BudgetPlanner({ month, onMonthChange }: BudgetPlannerProps) {
  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [saved, setSaved] = useState<MonthlyBudget | null>(null);
  const [values, setValues] = useState<BudgetFormValues>(emptyBudgetForm);
  const [fieldErrors, setFieldErrors] = useState<BudgetFieldErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [failedSubmits, setFailedSubmits] = useState(0);
  const savingRef = useRef(false);
  const formRef = useFocusFirstInvalid(failedSubmits);

  useEffect(() => {
    let active = true;

    async function loadBudget() {
      setLoad({ status: "loading" });
      setNotice(null);
      setSaveError(null);
      setFieldErrors({});
      try {
        const budget = await getBudget(month);
        if (!active) return;
        setSaved(budget);
        setValues(budget ? formFromBudget(budget) : emptyBudgetForm());
        setLoad({ status: "ready" });
      } catch (error) {
        if (!active) return;
        setSaved(null);
        setLoad({ status: "error", message: loadErrorMessage(error) });
      }
    }

    void loadBudget();
    return () => {
      active = false;
    };
  }, [month, reloadKey]);

  function setField(key: "plannedIncome" | "savingsTarget", raw: string) {
    setValues((v) => ({ ...v, [key]: cleanNumberString(raw) }));
    setNotice(null);
  }

  function setAllocation(group: KakeiboGroup, raw: string) {
    setValues((v) => ({ ...v, allocations: { ...v.allocations, [group]: cleanNumberString(raw) } }));
    setNotice(null);
  }

  async function submit() {
    if (savingRef.current) return; // no duplicate submissions
    const errors = validateBudgetForm(values);
    setFieldErrors(errors);
    setSaveError(null);
    setNotice(null);
    if (Object.keys(errors).length > 0) {
      setFailedSubmits((n) => n + 1);
      return;
    }

    savingRef.current = true;
    setSaving(true);
    try {
      const stored = await saveBudget(month, toBudgetInput(values));
      setSaved(stored);
      setValues(formFromBudget(stored));
      setNotice(`Budget for ${formatMonthYear(stored.month)} saved.`);
    } catch (error) {
      // Entered values stay in the form; nothing is shown as saved.
      if (error instanceof ApiError && error.kind === "validation") {
        setFieldErrors(error.fieldErrors);
        setSaveError(
          error.fieldErrors.month
            ? error.fieldErrors.month
            : "Your plan was not saved. Please correct the highlighted fields.",
        );
      } else if (error instanceof ApiError && error.kind === "unauthenticated") {
        setSaveError("Your session has ended. Sign in again to save this plan.");
      } else if (error instanceof ApiError && error.kind === "network") {
        setSaveError(`Your plan was not saved. ${error.message}`);
      } else {
        setSaveError("Your plan was not saved because something went wrong. Your entries are kept; please try again.");
      }
      setFailedSubmits((n) => n + 1);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void submit();
  }

  const monthLabel = formatMonthYear(month);
  const unchanged = sameAsSaved(values, saved);
  const preview = previewPlan(values);
  // The saved plan's figures come from the server; edits show a labelled local preview.
  const figures = unchanged && saved ? saved : preview;
  const figuresLabel = unchanged && saved ? "Saved plan" : "Preview — not saved yet";

  return (
    <div>
      <PageHeader
        title="Budget"
        subtitle="Plan your month: expected income, a savings target and four Kakeibo groups."
        action={<MonthNavigator month={month} onChange={onMonthChange} disabled={saving} />}
      />

      {load.status === "loading" ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_20rem]" aria-busy="true">
          <p className="sr-only" role="status">
            Loading budget for {monthLabel}…
          </p>
          <Skeleton className="h-96 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : load.status === "error" ? (
        <div className="flex flex-col gap-3">
          <FormAlert tone="error">{load.message}</FormAlert>
          <Button variant="secondary" size="sm" className="self-start" onClick={() => setReloadKey((k) => k + 1)}>
            Try again
          </Button>
        </div>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit} noValidate className="grid gap-4 lg:grid-cols-[1fr_20rem] items-start">
          <div className="flex flex-col gap-4">
            {saved ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                You have a saved plan for <strong>{monthLabel}</strong>. Change any amount and save to update it.
              </p>
            ) : (
              <FormAlert tone="info">
                No budget for {monthLabel} yet. Enter your planned amounts and save to create one. Use 0 for anything
                you don&apos;t plan to use.
              </FormAlert>
            )}

            {notice && (
              <div className="flex flex-wrap items-center gap-3">
                <FormAlert tone="info">{notice}</FormAlert>
                <Link
                  href={`/dashboard?month=${month}`}
                  className="text-sm font-semibold text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
                >
                  View dashboard
                </Link>
              </div>
            )}
            {saveError && <FormAlert tone="error">{saveError}</FormAlert>}

            <Card>
              <fieldset className="flex flex-col gap-4">
                <legend className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Income and savings (planned)
                </legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <MoneyInput
                    label="Planned income"
                    hint="What you expect to receive this month. Recorded income is tracked separately."
                    value={values.plannedIncome}
                    onChange={(e) => setField("plannedIncome", e.target.value)}
                    error={fieldErrors.plannedIncome}
                    name="plannedIncome"
                  />
                  <MoneyInput
                    label="Savings target"
                    hint="An intention to set aside. Divido does not move money."
                    value={values.savingsTarget}
                    onChange={(e) => setField("savingsTarget", e.target.value)}
                    error={fieldErrors.savingsTarget}
                    name="savingsTarget"
                  />
                </div>
              </fieldset>
            </Card>

            <Card>
              <fieldset className="flex flex-col gap-4">
                <legend className="mb-1 text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Kakeibo group budgets (planned)
                </legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  {BUDGET_GROUPS.map((group) => (
                    <MoneyInput
                      key={group}
                      label={`${GROUP_LABELS[group]} budget`}
                      hint={GROUP_HINTS[group]}
                      value={values.allocations[group]}
                      onChange={(e) => setAllocation(group, e.target.value)}
                      error={fieldErrors[`allocations.${group}`]}
                      name={`allocations.${group}`}
                    />
                  ))}
                </div>
                {fieldErrors.allocations && (
                  <p className="text-xs font-medium text-red-600 dark:text-red-400">{fieldErrors.allocations}</p>
                )}
              </fieldset>
            </Card>

            <div className="flex items-center gap-3">
              <Button type="submit" loading={saving} disabled={saving}>
                {saving ? "Saving…" : saved ? "Save changes" : "Create budget"}
              </Button>
              {saveError && !saving && (
                <Button type="button" variant="secondary" onClick={() => void submit()}>
                  Try again
                </Button>
              )}
            </div>
          </div>

          <aside aria-labelledby="plan-summary-heading" className="lg:sticky lg:top-24">
            <Card>
              <h2 id="plan-summary-heading" className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                {figuresLabel}
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{monthLabel} · planned amounts only</p>
              {figures ? (
                <PlanFigures
                  plannedIncome={values.plannedIncome}
                  savingsTarget={values.savingsTarget}
                  allocationTotal={figures.allocationTotal}
                  plannedTotal={figures.plannedTotal}
                  overAllocationAmount={figures.overAllocationAmount}
                  overAllocated={figures.overAllocated}
                />
              ) : (
                <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
                  Enter a valid amount in every field to see your plan totals.
                </p>
              )}
            </Card>
          </aside>
        </form>
      )}
    </div>
  );
}

function PlanFigures(props: {
  plannedIncome: string;
  savingsTarget: string;
  allocationTotal: string;
  plannedTotal: string;
  overAllocationAmount: string;
  overAllocated: boolean;
}) {
  const fits = !props.overAllocated;
  const unplanned = absAmount(props.overAllocationAmount);
  return (
    <div className="mt-4 flex flex-col gap-4">
      <dl className="flex flex-col gap-2 text-sm">
        <Row label="Group budgets total" value={props.allocationTotal} />
        <Row label="Savings target" value={props.savingsTarget} />
        <div className="border-t border-zinc-200 pt-2 dark:border-zinc-800">
          <Row label="Planned total" value={props.plannedTotal} strong />
        </div>
        <Row label="Planned income" value={props.plannedIncome} />
      </dl>
      {fits ? (
        <p className="text-sm text-zinc-700 dark:text-zinc-300" role="status">
          {props.overAllocationAmount === "0.00" || props.overAllocationAmount === "-0.00" ? (
            "Your plan uses all of your planned income."
          ) : (
            <>
              Not yet planned: <MoneyAmount amount={unplanned} className="font-semibold" />
            </>
          )}
        </p>
      ) : (
        <div role="status" className="rounded-md border border-amber-600 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-400 dark:bg-amber-950 dark:text-amber-100">
          <p className="font-semibold">
            Plan exceeds planned income by <MoneyAmount amount={props.overAllocationAmount} className="font-semibold !text-current" />
          </p>
          <p className="mt-1">
            Savings target plus group budgets is {formatShort(props.plannedTotal)}, but planned income is{" "}
            {formatShort(props.plannedIncome)}. You can still save this plan; consider lowering a group budget or the
            savings target.
          </p>
        </div>
      )}
    </div>
  );
}

function formatShort(value: string) {
  return <MoneyAmount amount={value} className="!text-current" />;
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className={strong ? "font-semibold text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400"}>
        {label}
      </dt>
      <dd>
        <MoneyAmount amount={value} className={strong ? "font-semibold" : ""} />
      </dd>
    </div>
  );
}
