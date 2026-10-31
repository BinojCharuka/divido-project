"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { FormAlert } from "@/components/feedback/FormAlert";
import { DateInput } from "@/components/forms/DateInput";
import { MoneyInput } from "@/components/forms/MoneyInput";
import { SelectField } from "@/components/forms/SelectField";
import { TextAreaField } from "@/components/forms/TextAreaField";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CategorySelect } from "@/features/categories/CategorySelect";
import { ApiError } from "@/lib/api/client";
import { createTransaction } from "@/lib/api/transactions";
import { getTodayIso } from "@/lib/formatting/dates";
import { normalizeMoneyInput } from "@/lib/formatting/money";
import { validateExpense, type FieldErrors } from "@/lib/validation/transactions";

export interface ExpenseFormProps {
  onSuccess?: () => void;
}

const PAYMENT_METHODS = [
  { id: "CASH", label: "Cash" },
  { id: "DEBIT_CARD", label: "Debit Card" },
  { id: "CREDIT_CARD", label: "Credit Card" },
  { id: "BANK_TRANSFER", label: "Bank Transfer" },
  { id: "OTHER", label: "Other" },
];

export function ExpenseForm({ onSuccess }: ExpenseFormProps) {
  const router = useRouter();

  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(getTodayIso());
  const [description, setDescription] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;

    const input = {
      type: "EXPENSE" as const,
      amount: amount.trim(),
      categoryId,
      date,
      description: description.trim() || undefined,
      paymentMethod: paymentMethod || undefined,
    };

    const errors = validateExpense(input);
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
        router.push("/transactions?notice=expense-saved");
      }
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors(error.fieldErrors);
        setFormError(error.message);
      } else {
        setFormError("Could not save expense. Please check your connection and try again.");
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
          hint="Total spent in Sri Lankan Rupees (LKR)"
          autoFocus
          required
        />

        <CategorySelect
          value={categoryId}
          onChange={(id) => setCategoryId(id)}
          error={fieldErrors.categoryId}
        />

        <DateInput
          label="Date *"
          value={date}
          onChange={(newDate) => setDate(newDate)}
          error={fieldErrors.date}
        />

        <TextAreaField
          label="Description (optional)"
          placeholder="e.g. Weekly supermarket run, electricity bill"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          error={fieldErrors.description}
          maxLength={500}
          currentLength={description.length}
        />

        <SelectField
          label="Payment Method (optional)"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          hint="Method used to make the payment"
        >
          <option value="">Choose method (optional)</option>
          {PAYMENT_METHODS.map((method) => (
            <option key={method.id} value={method.id}>
              {method.label}
            </option>
          ))}
        </SelectField>

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
            Save expense
          </Button>
        </div>
      </form>
    </Card>
  );
}
