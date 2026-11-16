import { BriefcaseBusiness, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { IncomeSource } from "@/types/income-source";

export function IncomeSourceCard({
  source: s,
  onRename,
  onDeactivate,
}: {
  source: IncomeSource;
  onRename: () => void;
  onDeactivate: () => void;
}) {
  return (
    <li className={`panel source-card ${s.active ? "" : "inactive-card"}`}>
      <div className="source-card-heading">
        <span className="group-icon" aria-hidden="true">
          <BriefcaseBusiness size={20} />
        </span>
        <h3>{s.name}</h3>
        <span className={`status-badge ${s.active ? "" : "status-inactive"}`}>{s.active ? "Active" : "Inactive"}</span>
      </div>
      <div className="record-actions">
        <Button onClick={onRename} aria-label={`Rename ${s.name}`}>
          <Pencil size={14} aria-hidden="true" />
          Rename
        </Button>
        {s.active && (
          <Button variant="ghost" onClick={onDeactivate} aria-label={`Deactivate ${s.name}`}>
            Deactivate
          </Button>
        )}
      </div>
    </li>
  );
}
