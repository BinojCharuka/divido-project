import { normalizeMoneyInput } from "@/lib/formatting/money";
import type { Transaction, TransactionUpdate } from "@/types/transaction";

export interface EditableTransactionValues {
  amount: string;
  date: string;
  description: string;
  categoryId: string;
  incomeSourceId: string;
  paymentMethod: string;
}

/**
 * Sends only the fields that changed. A cleared optional field is sent as `null`,
 * because the backend leaves omitted fields untouched; sending `undefined` would
 * drop the key and silently keep the old value.
 */
export function buildTransactionPatch(original: Transaction, next: EditableTransactionValues): TransactionUpdate {
  const patch: TransactionUpdate = {};
  if (next.amount !== normalizeMoneyInput(original.amount)) patch.amount = next.amount;
  if (next.date !== original.date) patch.date = next.date;
  if (next.description !== (original.description ?? "")) patch.description = next.description || null;

  if (original.type === "EXPENSE") {
    if (next.categoryId !== (original.category?.id ?? "")) patch.categoryId = next.categoryId;
    if (next.paymentMethod !== (original.paymentMethod ?? "")) patch.paymentMethod = next.paymentMethod || null;
  } else if (next.incomeSourceId !== (original.incomeSource?.id ?? "")) {
    patch.incomeSourceId = next.incomeSourceId || null;
  }
  return patch;
}

export const PAYMENT_METHODS: { id: string; label: string }[] = [
  { id: "CASH", label: "Cash" },
  { id: "DEBIT_CARD", label: "Debit card" },
  { id: "CREDIT_CARD", label: "Credit card" },
  { id: "BANK_TRANSFER", label: "Bank transfer" },
  { id: "OTHER", label: "Other" },
];

export function paymentMethodLabel(id: string | null | undefined): string | null {
  if (!id) return null;
  return PAYMENT_METHODS.find((m) => m.id === id)?.label ?? id;
}
