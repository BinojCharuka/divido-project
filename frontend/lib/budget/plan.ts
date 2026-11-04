import type { BudgetAllocations, MonthlyBudgetInput } from "@/types/budget";
import type { KakeiboGroup } from "@/types/category";

/**
 * Budget form rules and an unsaved preview (DIV-017). The preview mirrors the
 * backend's BudgetCalculator for display while typing; the saved figures always come
 * from the API response. Arithmetic is done in whole cents with BigInt, so no binary
 * floating-point step can make the preview differ from the server by a cent.
 */

export const BUDGET_GROUPS: KakeiboGroup[] = ["NEEDS", "WANTS", "CULTURE", "UNEXPECTED"];

export const GROUP_LABELS: Record<KakeiboGroup, string> = {
  NEEDS: "Needs",
  WANTS: "Wants",
  CULTURE: "Culture",
  UNEXPECTED: "Unexpected",
};

/** Same ceiling as the backend and the NUMERIC(12,2) column. */
export const MAX_PLAN_AMOUNT = "9999999999.99";
// BigInt() calls, not literals: the TypeScript target is below ES2020.
const ZERO = BigInt(0);
const HUNDRED = BigInt(100);
const MAX_CENTS = BigInt("999999999999");
const AMOUNT_PATTERN = /^\d{1,15}(\.\d{1,2})?$/;

export interface BudgetFormValues {
  plannedIncome: string;
  savingsTarget: string;
  allocations: BudgetAllocations;
}

export type BudgetFieldErrors = Partial<Record<string, string>>;

export function emptyBudgetForm(): BudgetFormValues {
  return { plannedIncome: "", savingsTarget: "", allocations: { NEEDS: "", WANTS: "", CULTURE: "", UNEXPECTED: "" } };
}

/** Whole cents for a valid amount string, otherwise null. */
export function toCents(value: string): bigint | null {
  const trimmed = value.trim();
  if (!AMOUNT_PATTERN.test(trimmed)) return null;
  const [whole, fraction = ""] = trimmed.split(".");
  const cents = BigInt(whole) * HUNDRED + BigInt(fraction.padEnd(2, "0"));
  return cents > MAX_CENTS ? null : cents;
}

/** "1234.56" / "-10.00" from whole cents. */
export function fromCents(cents: bigint): string {
  const negative = cents < ZERO;
  const abs = negative ? -cents : cents;
  const whole = abs / HUNDRED;
  const fraction = (abs % HUNDRED).toString().padStart(2, "0");
  return `${negative ? "-" : ""}${whole}.${fraction}`;
}

function amountError(value: string, label: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return `${label} is required. Enter 0 if you plan nothing here.`;
  if (trimmed.startsWith("-")) return `${label} cannot be negative.`;
  if (!AMOUNT_PATTERN.test(trimmed)) return `${label} must be a number with at most 2 decimal places.`;
  if (toCents(trimmed) === null) return `${label} cannot exceed ${MAX_PLAN_AMOUNT}.`;
  return undefined;
}

/** Field keys match the backend's fieldErrors keys, e.g. "allocations.NEEDS". */
export function validateBudgetForm(values: BudgetFormValues): BudgetFieldErrors {
  const errors: BudgetFieldErrors = {};
  const income = amountError(values.plannedIncome, "Planned income");
  if (income) errors.plannedIncome = income;
  const savings = amountError(values.savingsTarget, "Savings target");
  if (savings) errors.savingsTarget = savings;
  for (const group of BUDGET_GROUPS) {
    const message = amountError(values.allocations[group], `${GROUP_LABELS[group]} allocation`);
    if (message) errors[`allocations.${group}`] = message;
  }
  return errors;
}

export interface PlanPreview {
  allocationTotal: string;
  plannedTotal: string;
  overAllocationAmount: string;
  overAllocated: boolean;
}

/** Null until every field holds a valid amount; a partial plan has no meaningful total. */
export function previewPlan(values: BudgetFormValues): PlanPreview | null {
  const income = toCents(values.plannedIncome);
  const savings = toCents(values.savingsTarget);
  const groups = BUDGET_GROUPS.map((group) => toCents(values.allocations[group]));
  if (income === null || savings === null || groups.some((g) => g === null)) return null;
  const allocationTotal = (groups as bigint[]).reduce((sum, g) => sum + g, ZERO);
  const plannedTotal = savings + allocationTotal;
  const over = plannedTotal - income;
  return {
    allocationTotal: fromCents(allocationTotal),
    plannedTotal: fromCents(plannedTotal),
    overAllocationAmount: fromCents(over),
    overAllocated: over > ZERO,
  };
}

export function toBudgetInput(values: BudgetFormValues): MonthlyBudgetInput {
  const allocations = {} as BudgetAllocations;
  for (const group of BUDGET_GROUPS) allocations[group] = values.allocations[group].trim();
  return { plannedIncome: values.plannedIncome.trim(), savingsTarget: values.savingsTarget.trim(), allocations };
}

export function formFromBudget(budget: MonthlyBudgetInput): BudgetFormValues {
  return {
    plannedIncome: budget.plannedIncome,
    savingsTarget: budget.savingsTarget,
    allocations: { ...budget.allocations },
  };
}

/** Strips a sign: shows magnitude when the meaning is carried by the label. */
export function absAmount(value: string): string {
  return value.startsWith("-") ? value.slice(1) : value;
}
