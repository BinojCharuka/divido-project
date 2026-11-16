"use client";

import { useRef, useState, type FormEvent } from "react";
import { getBudget, saveBudget } from "@/lib/api/budgets";
import { ApiError } from "@/lib/api/client";
import {
  emptyBudgetForm,
  formFromBudget,
  previewPlan,
  sameAsSaved,
  toBudgetInput,
  validateBudgetForm,
  type BudgetFieldErrors,
  type BudgetFormValues,
} from "@/lib/budget/plan";
import { formatMonthYear } from "@/lib/formatting/dates";
import { useFocusFirstInvalid } from "@/lib/useFocusFirstInvalid";
import { useApiData } from "@/lib/useApiData";
import type { MonthlyBudget } from "@/types/budget";
import type { KakeiboGroup } from "@/types/category";
import { saveErrorMessage } from "./saveErrorMessage";

/**
 * State for the monthly plan form: loads the saved plan, keeps the typed amounts,
 * validates and saves. After a save the form shows the amounts the server stored.
 */
export function useBudgetForm(month: string, onSaved: (message: string) => void) {
  const load = useApiData(() => getBudget(month), [month], "We couldn't load your plan for this month. Please try again.");
  const [formMonth, setFormMonth] = useState<string | null>(null);
  const [saved, setSaved] = useState<MonthlyBudget | null>(null);
  const [values, setValues] = useState<BudgetFormValues>(emptyBudgetForm);
  const [fieldErrors, setFieldErrors] = useState<BudgetFieldErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [failedSubmits, setFailedSubmits] = useState(0);
  const savingRef = useRef(false);
  const formRef = useFocusFirstInvalid(failedSubmits);

  // Fill the form once per loaded month (adjusting state while rendering, not in an effect).
  if (load.status === "ready" && formMonth !== month) {
    setFormMonth(month);
    setSaved(load.data);
    setValues(load.data ? formFromBudget(load.data) : emptyBudgetForm());
    setFieldErrors({});
    setSaveError(null);
  }

  function setField(key: "plannedIncome" | "savingsTarget", value: string) {
    setValues((v) => ({ ...v, [key]: value }));
  }
  function setAllocation(group: KakeiboGroup, value: string) {
    setValues((v) => ({ ...v, allocations: { ...v.allocations, [group]: value } }));
  }
  function reset() {
    setValues(saved ? formFromBudget(saved) : emptyBudgetForm());
    setFieldErrors({});
    setSaveError(null);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (savingRef.current) return;
    const errors = validateBudgetForm(values);
    setFieldErrors(errors);
    setSaveError(null);
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
      onSaved(`Plan for ${formatMonthYear(stored.month)} saved`);
    } catch (error) {
      if (error instanceof ApiError && error.kind === "validation") setFieldErrors(error.fieldErrors);
      setSaveError(saveErrorMessage(error));
      setFailedSubmits((n) => n + 1);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  const unchanged = sameAsSaved(values, saved);
  // Saved figures are the server's; while editing, an exact whole-cent preview.
  const figures = unchanged && saved ? saved : previewPlan(values);
  const figuresNote = unchanged && saved ? "Saved plan" : saved ? "Unsaved changes" : "Not saved yet";

  return {
    load: load.status === "ready" && formMonth !== month ? ({ status: "loading" } as const) : load,
    retry: load.retry,
    saved,
    values,
    fieldErrors,
    saveError,
    saving,
    unchanged,
    figures,
    figuresNote,
    formRef,
    setField,
    setAllocation,
    reset,
    submit,
  };
}
