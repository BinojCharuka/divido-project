"use client";

import { useState } from "react";
import { Trash2, TriangleAlert } from "lucide-react";
import { FormError } from "@/components/feedback/FieldError";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/client";
import { deleteTransaction } from "@/lib/api/transactions";
import { amountDigits } from "@/lib/formatting/decimal";
import type { Transaction } from "@/types/transaction";
import { transactionTitle } from "./TransactionRows";

/** Permanent delete (DEC-014) after an explicit confirmation. */
export function DeleteTransactionDialog({
  transaction: t,
  onCancel,
  onDone,
}: {
  transaction: Transaction;
  onCancel: () => void;
  onDone: (message: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const kind = t.type === "INCOME" ? "income" : "expense";

  async function confirm() {
    setPending(true);
    setError(null);
    try {
      await deleteTransaction(t.id);
      onDone("Transaction deleted");
    } catch (err) {
      if (err instanceof ApiError && err.kind === "not-found") {
        // Already gone (for example, deleted in another tab): say so instead of claiming we deleted it.
        onDone("That transaction no longer exists. It may have been deleted already.");
        return;
      }
      setError(err instanceof ApiError ? err.message : "We couldn't delete this transaction. Please try again.");
      setPending(false);
    }
  }

  return (
    <Modal title={`Delete this ${kind}?`} onClose={onCancel}>
      <div className="confirm-content">
        <span className="large-leaf" aria-hidden="true">
          <TriangleAlert size={27} />
        </span>
        <p>
          {transactionTitle(t)} (LKR {amountDigits(t.amount)}) will be removed permanently. This can’t be undone.
        </p>
      </div>
      <FormError message={error} />
      <div className="modal-actions">
        <Button onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={() => void confirm()} loading={pending}>
          <Trash2 size={16} aria-hidden="true" />
          {pending ? "Deleting…" : `Delete ${kind}`}
        </Button>
      </div>
    </Modal>
  );
}
