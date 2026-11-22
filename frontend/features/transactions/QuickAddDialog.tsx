import { ArrowDownLeft, ArrowUpRight, ChevronRight, Sparkles } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import type { TransactionType } from "@/types/transaction";

export function QuickAddDialog({
  onChoose,
  onScanReceipt,
  onClose,
}: {
  onChoose: (type: TransactionType) => void;
  onScanReceipt?: () => void;
  onClose: () => void;
}) {
  return (
    <Modal className="quick-add-modal" title="Add transaction" onClose={onClose}>
      <div className="add-options">
        {onScanReceipt && (
          <button type="button" onClick={onScanReceipt} className="group">
            <span className="group-icon !bg-[#13271c] !border-emerald-500/30 text-[#34d399]" aria-hidden="true">
              <Sparkles size={20} />
            </span>
            <div>
              <strong>Scan receipt</strong>
            </div>
            <ChevronRight size={19} aria-hidden="true" />
          </button>
        )}
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
