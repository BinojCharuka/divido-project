import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { amountDigits } from "@/lib/formatting/decimal";

export function BudgetSaveBar({
  plannedTotal,
  saving,
  unchanged,
  onReset,
}: {
  plannedTotal: string | null;
  saving: boolean;
  unchanged: boolean;
  onReset: () => void;
}) {
  return (
    <div className="budget-save-bar panel">
      <div>
        <span>Total planned, including savings</span>
        <strong>{plannedTotal ? `LKR ${amountDigits(plannedTotal)}` : "—"}</strong>
      </div>
      <div className="action-pair">
        <Button disabled={saving || unchanged} onClick={onReset}>
          Reset changes
        </Button>
        <Button type="submit" variant="primary" loading={saving}>
          {!saving && <Check size={17} aria-hidden="true" />}
          {saving ? "Saving…" : "Save plan"}
        </Button>
      </div>
    </div>
  );
}
