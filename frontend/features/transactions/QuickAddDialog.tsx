import { ArrowDownLeft, ArrowUpRight, ChevronRight } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import type { TransactionType } from "@/types/transaction";

export function QuickAddDialog({ onChoose, onClose }: { onChoose: (type: TransactionType) => void; onClose: () => void }) {
  return (
    <Modal className="quick-add-modal" title="Add transaction" onClose={onClose}>
      <div className="add-options">
        <button type="button" onClick={() => onChoose("EXPENSE")}>
          <span className="group-icon quick-add-expense" aria-hidden="true">
            <ArrowUpRight size={22} />
          </span>
          <div>
            <strong>Add expense</strong>
          </div>
          <ChevronRight size={19} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => onChoose("INCOME")}>
          <span className="group-icon green-icon" aria-hidden="true">
            <ArrowDownLeft size={22} />
          </span>
          <div>
            <strong>Add income</strong>
          </div>
          <ChevronRight size={19} aria-hidden="true" />
        </button>
      </div>
    </Modal>
  );
}
