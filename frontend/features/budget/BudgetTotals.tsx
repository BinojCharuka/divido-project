import { MoneyField } from "@/components/forms/MoneyField";
import { absAmount, type BudgetFieldErrors, type BudgetFormValues, type PlanPreview } from "@/lib/budget/plan";
import { amountDigits } from "@/lib/formatting/decimal";

/** Planned income, savings target, and what is left unplanned (or planned above income). */
export function BudgetTotals({
  values,
  fieldErrors,
  disabled,
  figures,
  figuresNote,
  onChange,
}: {
  values: BudgetFormValues;
  fieldErrors: BudgetFieldErrors;
  disabled: boolean;
  figures: PlanPreview | null;
  figuresNote: string;
  onChange: (key: "plannedIncome" | "savingsTarget", value: string) => void;
}) {
  return (
    <div className="budget-top-summary panel">
      <MoneyField
        label="Planned income"
        name="plannedIncome"
        value={values.plannedIncome}
        error={fieldErrors.plannedIncome}
        disabled={disabled}
        onChange={(v) => onChange("plannedIncome", v)}
      />
      <MoneyField
        label="Monthly savings target"
        name="savingsTarget"
        value={values.savingsTarget}
        error={fieldErrors.savingsTarget}
        disabled={disabled}
        onChange={(v) => onChange("savingsTarget", v)}
      />
      <div className="budget-unallocated" aria-live="polite">
        <span>{figures?.overAllocated ? "Above planned income" : "Left unplanned"}</span>
        <strong>{figures ? `LKR ${amountDigits(absAmount(figures.overAllocationAmount))}` : "—"}</strong>
        <span>{figures ? figuresNote : "Fill in every amount to see totals"}</span>
      </div>
    </div>
  );
}
