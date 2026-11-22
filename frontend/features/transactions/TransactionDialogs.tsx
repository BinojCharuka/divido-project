"use client";

import type { Transaction, TransactionType } from "@/types/transaction";
import { DeleteTransactionDialog } from "./DeleteTransactionDialog";
import { QuickAddDialog } from "./QuickAddDialog";
import { TransactionDetailDialog } from "./TransactionDetailDialog";
import { TransactionFormDialog, type InitialTransactionValues } from "./TransactionFormDialog";
import { ReceiptScanModal } from "@/features/receipts/ReceiptScanModal";

export type TransactionDialogState =
  | null
  | { mode: "choose" }
  | { mode: "scan" }
  | { mode: "form"; type: TransactionType; transaction?: Transaction; initialValues?: InitialTransactionValues }
  | { mode: "detail"; transaction: Transaction }
  | { mode: "delete"; transaction: Transaction };

/**
 * Routes between the transaction dialogs. Owned by the app shell so any page (and the
 * mobile dock) can open them; `onSaved` runs only after the server confirmed a change.
 */
export function TransactionDialogs({
  state,
  onStateChange,
  onSaved,
}: {
  state: TransactionDialogState;
  onStateChange: (next: TransactionDialogState) => void;
  onSaved: (message: string) => void;
}) {
  if (!state) return null;
  const close = () => onStateChange(null);
  const finish = (message: string) => {
    close();
    onSaved(message);
  };

  switch (state.mode) {
    case "choose":
      return (
        <QuickAddDialog
          onChoose={(type) => onStateChange({ mode: "form", type })}
          onScanReceipt={() => onStateChange({ mode: "scan" })}
          onClose={close}
        />
      );
    case "scan":
      return (
        <ReceiptScanModal
          onClose={close}
          onApply={(data) =>
            onStateChange({
              mode: "form",
              type: "EXPENSE",
              initialValues: { ...data, isAiScanned: true },
            })
          }
        />
      );
    case "form": {
      const { transaction, initialValues } = state;
      return (
        <TransactionFormDialog
          key={transaction?.id ?? (initialValues?.isAiScanned ? "scanned-" + Date.now() : state.type)}
          type={state.type}
          transaction={transaction}
          initialValues={initialValues}
          onClose={close}
          onBack={!transaction ? () => onStateChange({ mode: "choose" }) : undefined}
          onDelete={transaction ? () => onStateChange({ mode: "delete", transaction }) : undefined}
          onSaved={finish}
        />
      );
    }
    case "detail":
      return (
        <TransactionDetailDialog
          transaction={state.transaction}
          onClose={close}
          onEdit={() => onStateChange({ mode: "form", type: state.transaction.type, transaction: state.transaction })}
          onDelete={() => onStateChange({ mode: "delete", transaction: state.transaction })}
        />
      );
    case "delete":
      return (
        <DeleteTransactionDialog
          transaction={state.transaction}
          onCancel={() => onStateChange({ mode: "detail", transaction: state.transaction })}
          onDone={finish}
        />
      );
  }
}
