import { Pencil } from "lucide-react";
import { GroupBadge } from "@/components/financial/GroupBadge";
import { Button } from "@/components/ui/Button";
import type { Category } from "@/types/category";

/** One category. Built-in categories show no actions (DEC-013). */
export function CategoryCard({ category: c, onEdit, onDeactivate }: { category: Category; onEdit: () => void; onDeactivate: () => void }) {
  return (
    <li className={`panel category-card ${c.active ? "" : "inactive-card"}`}>
      <div className="category-card-title">
        <h3>{c.name}</h3>
      </div>
      <div className="record-tags">
        <span>{c.isDefault ? "Built-in" : "Custom"}</span>
        <span className={c.active ? "tag-active" : ""}>{c.active ? "Active" : "Inactive"}</span>
      </div>
      <GroupBadge group={c.group} />
      <div className="record-actions">
        {c.isDefault ? (
          <span className="default-note">Built-in categories can’t be changed</span>
        ) : (
          <>
            <Button onClick={onEdit} aria-label={`Edit ${c.name}`}>
              <Pencil size={14} aria-hidden="true" />
              Edit
            </Button>
            {c.active && (
              <Button variant="ghost" onClick={onDeactivate} aria-label={`Deactivate ${c.name}`}>
                Deactivate
              </Button>
            )}
          </>
        )}
      </div>
    </li>
  );
}
