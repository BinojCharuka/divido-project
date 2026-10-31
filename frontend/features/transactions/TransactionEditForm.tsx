"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { FormAlert } from "@/components/feedback/FormAlert";
import { TransactionTypeBadge } from "@/components/financial/TransactionTypeBadge";
import { DateInput } from "@/components/forms/DateInput";
import { MoneyInput } from "@/components/forms/MoneyInput";
import { SelectField } from "@/components/forms/SelectField";
import { TextAreaField } from "@/components/forms/TextAreaField";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CategorySelect } from "@/features/categories/CategorySelect";
import { IncomeSourceSelect } from "@/features/income-sources/IncomeSourceSelect";
import { ApiError } from "@/lib/api/client";
import { deleteTransaction, updateTransaction } from "@/lib/api/transactions";
import { normalizeMoneyInput } from "@/lib/formatting/money";
import { validateExpense, validateIncome, type FieldErrors } from "@/lib/validation/transactions";
import type { Transaction } from "@/types/transaction";

export interface TransactionEditFormProps {
  transaction: Transaction;
}

const PAYMENT_METHODS = [
  { id: "CASH", label: "Cash" },
  { id: "DEBIT_CARD", label: "Debit Card" },
  { id: "CREDIT_CARD", label: "Credit Card" },
  { id: "BANK_TRANSFER", label: "Bank Transfer" },
  { id: "OTHER", label: "Other" },
];

export function TransactionEditForm({ transaction }: TransactionEditFormProps) {
  const router = useRouter();

  const isExpense = transaction.type === "EXPENSE";

  const [amount, setAmount] = useState(transaction.amount);
  const [categoryId, setCategoryId] = useState(transaction.category?.id ?? "");
  const [incomeSourceId, setIncomeSourceId] = useState(transaction.incomeSource?.id ?? "");
  const [date, setDate] = useState(transaction.date);
  const [description, setDescription] = useState(transaction.description ?? "");
  const [paymentMethod, setPaymentMethod] = useState(transaction.paymentMethod ?? "");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Deletion state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (pending) return;

    const input = {
      amount: amount.trim(),
      date,
      description: description.trim() || undefined,
      ...(isExpense ? { categoryId, paymentMethod: paymentMethod || undefined } : { incomeSourceId: incomeSourceId || undefined }),
    };

    const errors = isExpense ? validateExpense(input) : validateIncome(input);
    setFieldErrors(errors);
    setFormError(null);

    if (Object.keys(errors).length > 0) return;

    setPending(true);
    try {
      await updateTransaction(transaction.id, {
        ...input,
        amount: normalizeMoneyInput(amount),
      });
      router.push("/transactions?notice=updated");
    } catch (error) {
      if (error instanceof ApiError) {
        setFieldErrors(error.fieldErrors);
        setFormError(error.message);
      } else {
        setFormError("Could not update transaction. Please try again.");
      }
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteTransaction(transaction.id);
      router.push("/transactions?notice=deleted");
    } catch {
      setFormError("Could not delete transaction. Please try again.");
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Card className="max-w-xl mx-auto">
        <form onSubmit={handleSave} noValidate className="flex flex-col gap-5">
          {formError && <FormAlert tone="error">{formError}</FormAlert>}

          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">Transaction Type</span>
            <TransactionTypeBadge type={transaction.type} />
          </div>

          <MoneyInput
            label="Amount *"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={fieldErrors.amount}
            required
          />

          {isExpense ? (
            <CategorySelect
              value={categoryId}
              onChange={(id) => setCategoryId(id)}
              error={fieldErrors.categoryId}
            />
          ) : (
            <IncomeSourceSelect
              value={incomeSourceId}
              onChange={(id) => setIncomeSourceId(id)}
              error={fieldErrors.incomeSourceId}
            />
          )}

          <DateInput
            label="Date *"
            value={date}
            onChange={(newDate) => setDate(newDate)}
            error={fieldErrors.date}
          />

          <TextAreaField
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={fieldErrors.description}
            maxLength={500}
            currentLength={description.length}
          />

          {isExpense && (
            <SelectField
              label="Payment Method (optional)"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="">Choose method (optional)</option>
              {PAYMENT_METHODS.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.label}
                </option>
              ))}
            </SelectField>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800">
            <Button
              type="button"
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
              disabled={pending}
            >
              Delete
            </Button>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.back()}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={pending}>
                Save changes
              </Button>
            </div>
          </div>
        </form>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Transaction"
        description="Are you sure you want to delete this transaction? This will remove it from your budget calculations."
        confirmLabel="Yes, delete"
        destructive
        loading={deleting}
      />
    </>
  );
}
