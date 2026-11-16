"use client";

import { useState, type FormEvent } from "react";
import { Check, ShieldCheck, Trash2 } from "lucide-react";
import { FormError } from "@/components/feedback/FieldError";
import { GroupBadge } from "@/components/financial/GroupBadge";
import { GROUP_META } from "@/components/financial/groups";
import { InputField } from "@/components/forms/InputField";
import { MoneyField } from "@/components/forms/MoneyField";
import { SelectField } from "@/components/forms/SelectField";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { listCategories } from "@/lib/api/categories";
import { ApiError } from "@/lib/api/client";
import { listIncomeSources } from "@/lib/api/income-sources";
import { createTransaction, updateTransaction } from "@/lib/api/transactions";
import { getTodayIso } from "@/lib/formatting/dates";
import { normalizeMoneyInput } from "@/lib/formatting/money";
import { buildTransactionPatch, PAYMENT_METHODS } from "@/lib/transactions/patch";
import { useApiData } from "@/lib/useApiData";
import { validateExpense, validateIncome, type FieldErrors } from "@/lib/validation/transactions";
import type { Category } from "@/types/category";
import type { IncomeSource } from "@/types/income-source";
import type { Transaction, TransactionType } from "@/types/transaction";

/**
 * Create or edit one transaction (TX-001..004). Edits send only changed fields
 * (buildTransactionPatch). Entered values are kept after any error.
 */
export function TransactionFormDialog({
  type,
  transaction,
  onClose,
  onDelete,
  onSaved,
}: {
  type: TransactionType;
  transaction?: Transaction;
  onClose: () => void;
  onDelete?: () => void;
  onSaved: (message: string) => void;
}) {
  const isIncome = type === "INCOME";
  const editing = !!transaction;

  const [amount, setAmount] = useState(transaction ? normalizeMoneyInput(transaction.amount) : "");
  const [categoryId, setCategoryId] = useState(transaction?.category?.id ?? "");
  const [incomeSourceId, setIncomeSourceId] = useState(transaction?.incomeSource?.id ?? "");
  const [date, setDate] = useState(transaction?.date ?? getTodayIso());
  const [description, setDescription] = useState(transaction?.description ?? "");
  const [paymentMethod, setPaymentMethod] = useState(transaction?.paymentMethod ?? "");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const options = useApiData<Category[] | IncomeSource[]>(
    () => (isIncome ? listIncomeSources() : listCategories()),
    [isIncome],
    `${isIncome ? "Income sources" : "Categories"} could not be loaded.`,
  );
  const loaded = options.status === "ready" ? options.data : [];
  // An edited record may point at an entry that is now inactive; keep it selectable.
  const categories = withCurrent(loaded as Category[], transaction?.category && { ...transaction.category, isDefault: false, active: false });
  const sources = withCurrent(loaded as IncomeSource[], transaction?.incomeSource && { ...transaction.incomeSource, active: false });
  const selectedCategory = isIncome ? undefined : categories.find((c) => c.id === categoryId);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const input = {
      amount: amount.trim(),
      date,
      description: description.trim() || undefined,
      ...(isIncome ? { incomeSourceId: incomeSourceId || undefined } : { categoryId, paymentMethod: paymentMethod || undefined }),
    };
    const errors = isIncome ? validateIncome(input) : validateExpense(input);
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) return;

    setPending(true);
    try {
      if (transaction) {
        const patch = buildTransactionPatch(transaction, {
          amount: normalizeMoneyInput(amount),
          date,
          description: description.trim(),
          categoryId,
          incomeSourceId,
          paymentMethod,
        });
        if (Object.keys(patch).length === 0) {
          onClose();
          return;
        }
        await updateTransaction(transaction.id, patch);
        onSaved("Transaction updated");
      } else {
        await createTransaction({ ...input, type, amount: normalizeMoneyInput(amount) });
        onSaved(isIncome ? "Income added" : "Expense saved");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.fieldErrors);
        setFormError(
          err.kind === "not-found" && transaction
            ? "This transaction no longer exists. It may have been deleted in another tab."
            : err.message,
        );
      } else {
        setFormError("We couldn't save this transaction. Please try again.");
      }
      setPending(false);
    }
  }

  const title = editing ? "Edit transaction" : isIncome ? "Record income" : "Record an expense";
  const optionsLoading = options.status === "loading";

  return (
    <Modal className="record-modal" title={title} onClose={onClose}>
      <form onSubmit={submit} className="transaction-form" noValidate aria-busy={pending}>
        <FormError message={formError} />
        <MoneyField label="Amount" required variant="large" name="amount" autoFocus value={amount} onChange={setAmount} error={fieldErrors.amount} />

        {isIncome ? (
          <SelectField
            label="Income source"
            optional
            name="incomeSourceId"
            value={incomeSourceId}
            onChange={setIncomeSourceId}
            disabled={options.status !== "ready"}
            error={fieldErrors.incomeSourceId}
            hint="A label for your income, not a connected account."
          >
            <option value="">{optionsLoading ? "Loading income sources…" : "No income source"}</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.active ? "" : " · inactive"}
              </option>
            ))}
          </SelectField>
        ) : (
          <SelectField
            label="Category"
            required
            name="categoryId"
            value={categoryId}
            onChange={setCategoryId}
            disabled={options.status !== "ready"}
            error={fieldErrors.categoryId}
            after={selectedCategory && <GroupBadge group={selectedCategory.group} />}
          >
            <option value="">{optionsLoading ? "Loading categories…" : "Choose a category"}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {GROUP_META[c.group].label}
                {c.active ? "" : " · inactive"}
              </option>
            ))}
          </SelectField>
        )}
        {options.status === "error" && (
          <p className="field-error" role="alert">
            {options.message}{" "}
            <button type="button" className="text-button" onClick={options.retry}>
              Try again
            </button>
          </p>
        )}

        <InputField label="Date" required type="date" name="date" value={date} onValueChange={setDate} error={fieldErrors.date} />
        <InputField
          label="Description"
          optional
          name="description"
          maxLength={500}
          placeholder={isIncome ? "What is this income for?" : "What was this expense for?"}
          value={description}
          onValueChange={setDescription}
          error={fieldErrors.description}
        />
        {!isIncome && (
          <SelectField label="Payment method" optional name="paymentMethod" value={paymentMethod} onChange={setPaymentMethod}>
            <option value="">Not specified</option>
            {PAYMENT_METHODS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </SelectField>
        )}

        <div className="inline-note">
          <ShieldCheck size={16} aria-hidden="true" />
          <span>This is a manual record. No money is moved.</span>
        </div>
        <div className="modal-actions">
          {onDelete && (
            <Button variant="ghost" className="destructive-text edit-delete" onClick={onDelete} disabled={pending}>
              <Trash2 size={15} aria-hidden="true" />
              Delete
            </Button>
          )}
          <Button onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={pending}>
            <Check size={16} aria-hidden="true" />
            {pending ? "Saving…" : editing ? "Save changes" : isIncome ? "Save income" : "Save expense"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function withCurrent<T extends { id: string }>(items: T[], current: T | null | undefined): T[] {
  return current && !items.some((item) => item.id === current.id) ? [current, ...items] : items;
}
