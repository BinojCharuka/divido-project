import { Pencil, Trash2 } from "lucide-react";
import { GROUP_META } from "@/components/financial/groups";
import { Money } from "@/components/financial/Money";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatDateDisplay } from "@/lib/formatting/dates";
import { paymentMethodLabel } from "@/lib/transactions/patch";
import type { Transaction } from "@/types/transaction";
import { TransactionIcon, transactionTitle } from "./TransactionRows";

export function TransactionDetailDialog({
  transaction: t,
  onClose,
  onEdit,
  onDelete,
}: {
  transaction: Transaction;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const income = t.type === "INCOME";
  const rows: [string, string][] = income
    ? [["Income source", t.incomeSource?.name ?? "Not specified"]]
    : [
        ["Category", t.category?.name ?? "Not specified"],
        ["Group", t.category ? GROUP_META[t.category.group].label : "Not specified"],
        ["Payment method", paymentMethodLabel(t.paymentMethod) ?? "Not specified"],
      ];
  rows.push(["Date", formatDateDisplay(t.date)], ["Description", t.description || "No description"]);

  return (
    <Modal title="Transaction details" onClose={onClose}>
      <div className="detail-amount">
        <TransactionIcon transaction={t} />
        <Money value={t.amount} sign={income ? "+" : "−"} />
        <h3>{transactionTitle(t)}</h3>
        <span className="subtle-tag">{income ? "Income" : "Expense"}</span>
      </div>
      <dl className="detail-list">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="modal-actions detail-actions">
        <Button variant="ghost" onClick={onDelete}>
          <Trash2 size={16} aria-hidden="true" />
          Delete
        </Button>
        <Button variant="primary" onClick={onEdit}>
          <Pencil size={16} aria-hidden="true" />
          Edit transaction
        </Button>
      </div>
    </Modal>
  );
}
