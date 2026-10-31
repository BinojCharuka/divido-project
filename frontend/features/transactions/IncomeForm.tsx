"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FormAlert } from "@/components/feedback/FormAlert";
import { DateInput } from "@/components/forms/DateInput";
import { MoneyInput } from "@/components/forms/MoneyInput";
import { TextAreaField } from "@/components/forms/TextAreaField";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IncomeSourceSelect } from "@/features/income-sources/IncomeSourceSelect";
import { ApiError } from "@/lib/api/client";
import { createTransaction } from "@/lib/api/transactions";
import { getTodayIso } from "@/lib/formatting/dates";
import { normalizeMoneyInput } from "@/lib/formatting/money";
import { validateIncome, type FieldErrors } from "@/lib/validation/transactions";

export interface IncomeFormProps {
  onSuccess?: () => void;
}

export function IncomeForm({ onSuccess }: IncomeFormProps) {
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [incomeSourceId, setIncomeSourceId] = useState("");
  const [date, setDate] = useState(getTodayIso());
  const [description, setDescription] = useState("");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;

    const input = {
      type: "INCOME" as const,
      amount: amount.trim(),
      incomeSourceId: incomeSourceId || undefined,
      date,
      description: description.trim() || undefined,
    };

    const errors = validateIncome(input);
    setFieldErrors(errors);
    setFormError(null);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setPending(true);
    try {
      await createTransaction({
        ...input,
        amount: normalizeMoneyInput(amount),
      });

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/transactions?notice=income-saved");
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors(error.fieldErrors);
        setFormError(error.message);
      } else {
        setFormError("Could not save income. Please check your connection and try again.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="max-w-xl mx-auto">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {formError && <FormAlert tone="error">{formError}</FormAlert>}

        <MoneyInput
          label="Amount *"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={fieldErrors.amount}
          hint="Total income received in Sri Lankan Rupees (LKR)"
          autoFocus
          required
        />

        <IncomeSourceSelect
          value={incomeSourceId}
          onChange={(id) => setIncomeSourceId(id)}
          error={fieldErrors.incomeSourceId}
        />

        <DateInput
          label="Date *"
          value={date}
          onChange={(newDate) => setDate(newDate)}
          error={fieldErrors.date}
        />

        <TextAreaField
          label="Description (optional)"
          placeholder="e.g. October monthly salary, client project advance"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={fieldErrors.description}
          maxLength={500}
          currentLength={description.length}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.back()}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={pending}>
            Save income
          </Button>
        </div>
      </form>
    </Card>
  );
}
