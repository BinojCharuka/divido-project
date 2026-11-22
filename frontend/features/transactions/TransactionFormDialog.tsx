"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, Check, Plus, ShieldCheck, Sparkles, Trash2 } from "lucide-react";
import { FormError } from "@/components/feedback/FieldError";
import { GroupBadge } from "@/components/financial/GroupBadge";
import { GROUP_META } from "@/components/financial/groups";
import { InputField } from "@/components/forms/InputField";
import { MoneyField } from "@/components/forms/MoneyField";
import { SelectField } from "@/components/forms/SelectField";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ReceiptScanModal, type ExtractedExpenseData } from "@/features/receipts/ReceiptScanModal";
import { listCategories } from "@/lib/api/categories";
import { ApiError } from "@/lib/api/client";
import { createIncomeSource, listIncomeSources } from "@/lib/api/income-sources";
import { createTransaction, updateTransaction } from "@/lib/api/transactions";
import { getTodayIso, formatDateDisplay, formatMonthYear } from "@/lib/formatting/dates";
import { normalizeMoneyInput } from "@/lib/formatting/money";
import { buildTransactionPatch, PAYMENT_METHODS } from "@/lib/transactions/patch";
import { useApiData } from "@/lib/useApiData";
import { validateExpense, validateIncome, type FieldErrors } from "@/lib/validation/transactions";
import type { Category } from "@/types/category";
import type { IncomeSource } from "@/types/income-source";
import type { Transaction, TransactionType } from "@/types/transaction";

export interface InitialTransactionValues {
  amount?: string;
  categoryId?: string;
  incomeSourceId?: string;
  date?: string;
  description?: string;
  paymentMethod?: string;
  isAiScanned?: boolean;
}

/**
 * Create or edit one transaction (TX-001..004). Edits send only changed fields
 * (buildTransactionPatch). Entered values are kept after any error.
 */
export function TransactionFormDialog({
  type,
  transaction,
  initialValues,
  onClose,
  onBack,
  onDelete,
  onSaved,
}: {
  type: TransactionType;
  transaction?: Transaction;
  initialValues?: InitialTransactionValues;
  onClose: () => void;
  onBack?: () => void;
  onDelete?: () => void;
  onSaved: (message: string, date?: string) => void;
}) {
  const [activeType, setActiveType] = useState<TransactionType>(type);
  const isIncome = activeType === "INCOME";
  const editing = !!transaction;

  const [amount, setAmount] = useState(
    transaction
      ? normalizeMoneyInput(transaction.amount)
      : initialValues?.amount
      ? normalizeMoneyInput(initialValues.amount)
      : ""
  );
  const [categoryId, setCategoryId] = useState(
    transaction?.category?.id ?? initialValues?.categoryId ?? ""
  );
  const [incomeSourceId, setIncomeSourceId] = useState(
    transaction?.incomeSource?.id ?? initialValues?.incomeSourceId ?? ""
  );
  const [date, setDate] = useState(
    transaction?.date ?? initialValues?.date ?? getTodayIso()
  );
  const [description, setDescription] = useState(
    transaction?.description ?? initialValues?.description ?? ""
  );
  const [paymentMethod, setPaymentMethod] = useState(
    transaction?.paymentMethod ?? initialValues?.paymentMethod ?? ""
  );
  const [isAiScanned, setIsAiScanned] = useState(!!initialValues?.isAiScanned);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const isSubmitting = useRef(false);

  const handleReceiptExtracted = (data: ExtractedExpenseData) => {
    if (data.amount) {
      const normalized = normalizeMoneyInput(data.amount);
      if (normalized && normalized !== "0.00") {
        setAmount(normalized);
      } else if (data.amount.trim()) {
        setAmount(data.amount.trim());
      }
    }
    if (data.date) setDate(data.date);
    if (data.description) setDescription(data.description);
    if (data.categoryId) {
      setCategoryId(data.categoryId);
    } else if (categories && categories.length > 0) {
      const target = (data.purpose || data.description || "").toLowerCase();
      const matched = categories.find((c) => target.includes(c.name.toLowerCase()));
      if (matched) setCategoryId(matched.id);
    }
    setIsAiScanned(true);
    setScannerOpen(false);
  };

  const options = useApiData<Category[] | IncomeSource[]>(
    () => (isIncome ? listIncomeSources() : listCategories()),
    [isIncome],
    `${isIncome ? "Income sources" : "Categories"} could not be loaded.`,
  );
  const loaded = options.status === "ready" ? options.data : [];
  // An edited record may point at an entry that is now inactive; keep it selectable.
  const categories = withCurrent(loaded as Category[], transaction?.category && { ...transaction.category, isDefault: false, active: false });

  const [createdSources, setCreatedSources] = useState<IncomeSource[]>([]);
  const [showAddSource, setShowAddSource] = useState(false);
  const [newSourceName, setNewSourceName] = useState("");
  const [creatingSource, setCreatingSource] = useState(false);
  const [newSourceError, setNewSourceError] = useState<string | null>(null);

  const baseSources = withCurrent(loaded as IncomeSource[], transaction?.incomeSource && { ...transaction.incomeSource, active: false });
  const sources = useMemo(() => {
    const combined = [...baseSources];
    for (const s of createdSources) {
      if (!combined.some((item) => item.id === s.id)) {
        combined.push(s);
      }
    }
    return combined;
  }, [baseSources, createdSources]);

  async function handleCreateSource() {
    const trimmed = newSourceName.trim();
    if (!trimmed) {
      setNewSourceError("Enter a name for this income source.");
      return;
    }
    setCreatingSource(true);
    setNewSourceError(null);
    try {
      const created = await createIncomeSource({ name: trimmed });
      setCreatedSources((prev) => [...prev, created]);
      setIncomeSourceId(created.id);
      setNewSourceName("");
      setShowAddSource(false);
    } catch (err) {
      if (err instanceof ApiError) {
        setNewSourceError(err.kind === "conflict" ? "You already have an income source with this name." : err.message);
      } else {
        setNewSourceError("Failed to create income source. Please try again.");
      }
    } finally {
      setCreatingSource(false);
    }
  }

  const selectedCategory = isIncome ? undefined : categories.find((c) => c.id === categoryId);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting.current || pending) return;
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

    isSubmitting.current = true;
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
        onSaved("Transaction updated", date);
      } else {
        await createTransaction({ ...input, type: activeType, amount: normalizeMoneyInput(amount) });
        onSaved(isIncome ? "Income added" : "Expense saved", date);
      }
    } catch (err) {
      isSubmitting.current = false;
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
    <Modal
      className="record-modal"
      title={title}
      eyebrow={editing ? "RECORD DETAILS" : "NEW RECORD"}
      onClose={onClose}
      onBack={onBack}
    >
      <form onSubmit={submit} className="transaction-form" noValidate aria-busy={pending}>
        <FormError message={formError} />

        {!editing && (
          <div className="w-full bg-[#111914] border border-white/[0.08] p-1 rounded-xl flex gap-1 mb-4" role="group" aria-label="Transaction type">
            <button
              type="button"
              className={`flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                !isIncome
                  ? "bg-[#1f2821] text-[#f87171] border border-red-500/20 shadow-xs"
                  : "text-zinc-400 hover:text-white"
              }`}
              onClick={() => setActiveType("EXPENSE")}
            >
              <ArrowUp size={14} className={!isIncome ? "text-[#f87171]" : "text-zinc-400"} />
              <span>Expense</span>
            </button>
            <button
              type="button"
              className={`flex-1 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                isIncome
                  ? "bg-[#1f2821] text-[#34d399] border border-emerald-500/20 shadow-xs"
                  : "text-zinc-400 hover:text-white"
              }`}
              onClick={() => setActiveType("INCOME")}
            >
              <ArrowDown size={14} className={isIncome ? "text-[#34d399]" : "text-zinc-400"} />
              <span>Income</span>
            </button>
          </div>
        )}

        {isAiScanned && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[#34d399] text-xs mb-3 shadow-xs">
            <Sparkles size={14} className="shrink-0 text-[#34d399]" />
            <span className="flex-1">
              Auto-filled from your receipt. Please review and edit before saving.
            </span>
          </div>
        )}

        {!editing && !isIncome && !isAiScanned && (
          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 mb-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[#34d399] hover:bg-emerald-500/15 hover:border-emerald-500/30 text-xs font-semibold transition-all cursor-pointer shadow-xs"
          >
            <Sparkles size={14} className="text-[#34d399]" />
            <span>Scan receipt</span>
          </button>
        )}

        <MoneyField label="Amount" required variant="large" name="amount" autoFocus value={amount} onChange={setAmount} error={fieldErrors.amount} />

        {isIncome ? (
          <div className="flex flex-col gap-1">
            <SelectField
              label="Income source"
              optional
              name="incomeSourceId"
              value={incomeSourceId}
              onChange={setIncomeSourceId}
              disabled={options.status !== "ready"}
              error={fieldErrors.incomeSourceId}
              hint="A label for your income, not a connected account."
              after={
                showAddSource ? (
                  <div className="p-3 rounded-xl bg-[#111c15] border border-emerald-500/25 flex flex-col gap-2 mt-2 shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <Plus size={13} className="text-[#34d399]" />
                        New income source
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddSource(false);
                          setNewSourceName("");
                          setNewSourceError(null);
                        }}
                        className="text-[11px] text-zinc-400 hover:text-white cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Salary, Freelance, Rent"
                        value={newSourceName}
                        onChange={(e) => {
                          setNewSourceName(e.target.value);
                          if (newSourceError) setNewSourceError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleCreateSource();
                          }
                        }}
                        className="flex-1 px-3 py-2 rounded-lg bg-[#07100b] border border-white/10 text-white text-xs placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
                        autoFocus
                      />
                      <Button
                        type="button"
                        variant="primary"
                        loading={creatingSource}
                        disabled={!newSourceName.trim() || creatingSource}
                        onClick={handleCreateSource}
                        className="bg-[#10b981] hover:bg-[#059669] text-white text-xs px-3 py-1.5 cursor-pointer font-medium"
                      >
                        Add
                      </Button>
                    </div>
                    {newSourceError && (
                      <span className="text-[11px] text-red-400 font-medium">{newSourceError}</span>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between mt-1.5">
                    {sources.length === 0 && !optionsLoading ? (
                      <span className="text-[11px] text-zinc-400">No income sources found yet.</span>
                    ) : (
                      <span />
                    )}
                    <button
                      type="button"
                      onClick={() => setShowAddSource(true)}
                      className="text-xs text-[#34d399] hover:text-[#10b981] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus size={13} strokeWidth={2.4} />
                      <span>{sources.length === 0 ? "Create an income source" : "Add new source"}</span>
                    </button>
                  </div>
                )
              }
            >
              <option value="">{optionsLoading ? "Loading income sources…" : "No income source"}</option>
              {sources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.active ? "" : " · inactive"}
                </option>
              ))}
            </SelectField>
          </div>
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

        <div className="relative">
          <InputField
            label="Date"
            required
            type="date"
            name="date"
            value={date}
            onValueChange={setDate}
            error={fieldErrors.date}
            hint={
              date !== getTodayIso()
                ? `Selected date is ${formatDateDisplay(date)} (${formatMonthYear(date.slice(0, 7))}).`
                : undefined
            }
          />
          {date !== getTodayIso() && (
            <button
              type="button"
              onClick={() => setDate(getTodayIso())}
              className="absolute top-0 right-0 text-[11px] font-semibold text-[#34d399] hover:text-[#10b981] transition-colors cursor-pointer"
            >
              Set to today ({formatDateDisplay(getTodayIso())})
            </button>
          )}
        </div>
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
          <Button onClick={onClose} disabled={pending} className="bg-[#141f18] hover:bg-[#1a2b21] text-zinc-300 border border-white/10">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={pending}
            aria-label={pending ? "Saving…" : editing ? "Save changes" : isIncome ? "Save income" : "Save expense"}
            className="bg-[#10b981] hover:bg-[#059669] text-white font-medium shadow-md shadow-emerald-500/20"
          >
            <Check size={16} aria-hidden="true" />
            <span>{pending ? "Saving…" : editing ? "Save changes" : isIncome ? "Save income" : "Save expense"}</span>
          </Button>
        </div>
      </form>

      {scannerOpen && (
        <ReceiptScanModal
          onClose={() => setScannerOpen(false)}
          onApply={handleReceiptExtracted}
        />
      )}
    </Modal>
  );
}

function withCurrent<T extends { id: string }>(items: T[], current: T | null | undefined): T[] {
  return current && !items.some((item) => item.id === current.id) ? [current, ...items] : items;
}
