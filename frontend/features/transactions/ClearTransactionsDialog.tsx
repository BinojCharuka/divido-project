"use client";

import { useState } from "react";
import { Trash2, TriangleAlert } from "lucide-react";
import { FormError } from "@/components/feedback/FieldError";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/client";
import { clearAllTransactions } from "@/lib/api/transactions";

/**
 * Confirmation dialog for permanently clearing all transactions belonging to the current user.
 */
export function ClearTransactionsDialog({
  onCancel,
  onDone,
}: {
  onCancel: () => void;
  onDone: (message: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setPending(true);
    setError(null);
    try {
      await clearAllTransactions();
      onDone("All transactions have been cleared.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't clear your transactions. Please try again.");
      setPending(false);
    }
  }

  return (
    <Modal title="Clear all transactions?" onClose={pending ? () => {} : onCancel}>
      <div className="confirm-content flex items-start gap-3.5 my-2">
        <span
          className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0"
          aria-hidden="true"
        >
          <TriangleAlert size={22} />
        </span>
        <div className="text-sm text-zinc-300 leading-relaxed">
          <p className="font-medium text-white mb-1">
            This will permanently delete all your recorded transactions.
          </p>
          <p className="text-zinc-400 text-xs">
            Every income and expense entry across all months will be removed. Your budgets, categories, and settings will remain untouched. This action cannot be undone.
          </p>
        </div>
      </div>
      <FormError message={error} />
      <div className="modal-actions mt-6 flex items-center justify-end gap-3">
        <Button onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={() => void confirm()} loading={pending}>
          <Trash2 size={16} aria-hidden="true" />
          {pending ? "Clearing…" : "Clear all transactions"}
        </Button>
      </div>
    </Modal>
  );
}
