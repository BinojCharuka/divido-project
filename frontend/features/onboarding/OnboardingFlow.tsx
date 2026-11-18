"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, CalendarCheck, PiggyBank, ReceiptText } from "lucide-react";
import { FormAlert } from "@/components/feedback/FormAlert";
import { MoneyField } from "@/components/forms/MoneyField";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api/client";
import { getBudget, saveBudget } from "@/lib/api/budgets";
import { completeOnboarding } from "@/lib/api/profile";
import { useAuth } from "@/lib/auth/AuthProvider";
import { displayNameFor } from "@/lib/auth/displayName";
import { MAX_PLAN_AMOUNT, toCents } from "@/lib/budget/plan";
import { formatMonthYear, getCurrentMonth } from "@/lib/formatting/dates";
import { formatMoney } from "@/lib/formatting/money";
import { useFocusFirstInvalid } from "@/lib/useFocusFirstInvalid";

const STEPS = 3;
const FALLBACK = "Something went wrong. Please try again.";

type Step = 1 | 2 | 3;
type Plan = { status: "loading" } | { status: "none" } | { status: "exists"; income: string } | { status: "error" };

function amountError(value: string, label: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return `Enter ${label.toLowerCase()}, or 0.`;
  if (toCents(trimmed) === null) return `${label} must be a number up to ${MAX_PLAN_AMOUNT}, with at most 2 decimal places.`;
  return undefined;
}

/**
 * DIV-023 (DEC-044): welcome → this month's income and savings → done. Every step can
 * be skipped. Finishing or skipping records completion on the server, so it shows once.
 */
export function OnboardingFlow() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const month = getCurrentMonth();
  const [step, setStep] = useState<Step>(1);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);

  // Already done (another tab, or a bookmark): onboarding shows only once.
  const done = user?.onboardingComplete === true;
  useEffect(() => {
    if (done) router.replace("/dashboard");
  }, [done, router]);

  async function finish(destination: string) {
    if (finishing) return;
    setFinishing(true);
    setFinishError(null);
    try {
      await completeOnboarding();
      router.replace(destination);
      updateUser({ onboardingComplete: true });
    } catch (error) {
      setFinishError(error instanceof ApiError ? error.message : FALLBACK);
      setFinishing(false);
    }
  }

  const skip = (
    <Button variant="ghost" onClick={() => void finish("/dashboard")} disabled={finishing}>
      Skip for now
    </Button>
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="onboarding-steps" role="img" aria-label={`Step ${step} of ${STEPS}`}>
        {Array.from({ length: STEPS }, (_, i) => (
          <span key={i} data-done={i < step} />
        ))}
      </div>
      {finishError && <FormAlert tone="error">{finishError}</FormAlert>}

      {step === 1 && (
        <section aria-labelledby="onboarding-welcome" className="flex flex-col gap-5">
          <div>
            <h2 id="onboarding-welcome" className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Welcome, {displayNameFor(user)}
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Divido works one month at a time. Here is the rhythm:
            </p>
          </div>
          <ul className="flex flex-col gap-3 text-sm text-zinc-700 dark:text-zinc-300">
            <li className="flex gap-3">
              <PiggyBank size={18} aria-hidden="true" className="shrink-0 text-emerald-600 dark:text-emerald-400" />
              Plan your income and what you want to save.
            </li>
            <li className="flex gap-3">
              <ReceiptText size={18} aria-hidden="true" className="shrink-0 text-emerald-600 dark:text-emerald-400" />
              Record what you spend in four groups.
            </li>
            <li className="flex gap-3">
              <CalendarCheck size={18} aria-hidden="true" className="shrink-0 text-emerald-600 dark:text-emerald-400" />
              Look back at the end of the month.
            </li>
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-3">
            {skip}
            <Button variant="primary" onClick={() => setStep(2)} disabled={finishing}>
              Get started <ArrowRight size={16} aria-hidden="true" />
            </Button>
          </div>
        </section>
      )}

      {step === 2 && <PlanStep month={month} skip={skip} disabled={finishing} onSaved={() => setStep(3)} />}

      {step === 3 && (
        <section aria-labelledby="onboarding-done" className="flex flex-col gap-5">
          <div>
            <h2 id="onboarding-done" className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              You&apos;re ready
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Your dashboard shows {formatMonthYear(month)} at a glance. You can split your plan across the four groups
              on the Budget page whenever you like.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button onClick={() => void finish(`/budget?month=${month}`)} disabled={finishing}>
              Open budget
            </Button>
            <Button variant="primary" loading={finishing} onClick={() => void finish("/dashboard")}>
              {finishing ? "Opening…" : "Go to dashboard"}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

function PlanStep({
  month,
  skip,
  disabled,
  onSaved,
}: {
  month: string;
  skip: ReactNode;
  disabled: boolean;
  onSaved: () => void;
}) {
  const [plan, setPlan] = useState<Plan>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [income, setIncome] = useState("");
  const [savings, setSavings] = useState("");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [failedSubmits, setFailedSubmits] = useState(0);
  const formRef = useFocusFirstInvalid(failedSubmits);

  useEffect(() => {
    let active = true;
    getBudget(month).then(
      (budget) => active && setPlan(budget ? { status: "exists", income: budget.plannedIncome } : { status: "none" }),
      () => active && setPlan({ status: "error" }),
    );
    return () => {
      active = false;
    };
  }, [month, attempt]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const found = {
      plannedIncome: amountError(income, "Planned income"),
      savingsTarget: amountError(savings, "Savings target"),
    };
    setErrors(found);
    setFormError(null);
    if (found.plannedIncome || found.savingsTarget) {
      setFailedSubmits((n) => n + 1);
      return;
    }
    setPending(true);
    try {
      // The group allocations start at zero; the Budget page is where they are split.
      await saveBudget(month, {
        plannedIncome: income.trim(),
        savingsTarget: savings.trim(),
        allocations: { NEEDS: "0.00", WANTS: "0.00", CULTURE: "0.00", UNEXPECTED: "0.00" },
      });
      onSaved();
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null;
      setErrors(apiError?.kind === "validation" ? { ...apiError.fieldErrors } : {});
      setFormError(apiError?.message ?? FALLBACK);
      setFailedSubmits((n) => n + 1);
      setPending(false);
    }
  }

  const heading = (
    <div>
      <h2 id="onboarding-plan" className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Plan {formatMonthYear(month)}
      </h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
        How much do you expect to earn this month, and how much would you like to keep?
      </p>
    </div>
  );

  if (plan.status === "loading") {
    return (
      <section aria-labelledby="onboarding-plan" className="flex flex-col gap-5">
        {heading}
        <p role="status" className="text-sm text-zinc-600 dark:text-zinc-400">
          Checking this month&apos;s plan…
        </p>
      </section>
    );
  }

  if (plan.status === "error" || plan.status === "exists") {
    return (
      <section aria-labelledby="onboarding-plan" className="flex flex-col gap-5">
        {heading}
        {plan.status === "error" ? (
          <FormAlert tone="error">We couldn&apos;t check this month&apos;s plan. Try again, or skip for now.</FormAlert>
        ) : (
          <FormAlert tone="info">
            You already have a plan for {formatMonthYear(month)}, with {formatMoney(plan.income)} planned income.
          </FormAlert>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {skip}
          {plan.status === "error" ? (
            <Button onClick={() => setAttempt((n) => n + 1)} disabled={disabled}>
              Try again
            </Button>
          ) : (
            <Button variant="primary" onClick={onSaved} disabled={disabled}>
              Continue <ArrowRight size={16} aria-hidden="true" />
            </Button>
          )}
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby="onboarding-plan">
      <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-5" aria-busy={pending}>
        {heading}
        {formError && <FormAlert tone="error">{formError}</FormAlert>}
        <div>
          <MoneyField
            label="Planned income"
            name="plannedIncome"
            value={income}
            onChange={setIncome}
            error={errors.plannedIncome}
            disabled={pending}
          />
          <MoneyField
            label="Savings target"
            name="savingsTarget"
            value={savings}
            onChange={setSavings}
            error={errors.savingsTarget}
            disabled={pending}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          {skip}
          <Button type="submit" variant="primary" loading={pending} disabled={disabled}>
            {pending ? "Saving…" : "Save and continue"}
          </Button>
        </div>
      </form>
    </section>
  );
}
