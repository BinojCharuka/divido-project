"use client";

import { useState } from "react";
import { Plus, ShieldCheck } from "lucide-react";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { InlineError } from "@/components/feedback/InlineError";
import { LoadingPanel } from "@/components/feedback/LoadingPanel";
import { ShowInactiveToggle } from "@/components/forms/ShowInactiveToggle";
import { BackLink } from "@/components/layout/BackLink";
import { useAppShell } from "@/components/layout/AppShellContext";
import { PageHeading } from "@/components/layout/PageHeading";
import { Button } from "@/components/ui/Button";
import { deactivateCategory, listCategories } from "@/lib/api/categories";
import { useApiData } from "@/lib/useApiData";
import type { Category, KakeiboGroup } from "@/types/category";
import { CategoryCard } from "./CategoryCard";
import { CategoryFormDialog } from "./CategoryFormDialog";
import { GroupFilterTabs } from "./GroupFilterTabs";

type Dialog = { kind: "edit"; category: Category | null } | { kind: "deactivate"; category: Category } | null;

/**
 * Category management (CAT-001..004). The three built-in categories are read-only
 * (DEC-013). The list changes only after the server confirms a change.
 */
export function CategoriesPage() {
  const { notify } = useAppShell();
  const [showInactive, setShowInactive] = useState(false);
  const [filter, setFilter] = useState<KakeiboGroup | "ALL">("ALL");
  const [dialog, setDialog] = useState<Dialog>(null);
  const list = useApiData(() => listCategories({ includeInactive: showInactive }), [showInactive], "We couldn't load your categories.");

  const done = (message: string) => {
    setDialog(null);
    list.retry();
    notify(message);
  };

  const items = list.status === "ready" ? list.data.filter((c) => filter === "ALL" || c.group === filter) : [];

  return (
    <>
      <BackLink href="/settings" label="Settings" />
      <PageHeading
        title="Expense categories"
        actions={
          <Button variant="primary" onClick={() => setDialog({ kind: "edit", category: null })}>
            <Plus size={17} aria-hidden="true" />
            Add category
          </Button>
        }
      />
      <div className="management-toolbar">
        <GroupFilterTabs value={filter} onChange={setFilter} />
        <ShowInactiveToggle checked={showInactive} onChange={setShowInactive} />
      </div>

      {list.status === "loading" && <LoadingPanel label="Loading categories…" />}
      {list.status === "error" && <InlineError message={list.message} onRetry={list.retry} />}
      {list.status === "ready" && items.length === 0 && (
        <div className="panel empty-state">
          <h3>No categories here</h3>
          <p>Add a category to organise your spending in this group.</p>
        </div>
      )}
      {items.length > 0 && (
        <ul className="category-grid">
          {items.map((c) => (
            <CategoryCard
              key={c.id}
              category={c}
              onEdit={() => setDialog({ kind: "edit", category: c })}
              onDeactivate={() => setDialog({ kind: "deactivate", category: c })}
            />
          ))}
        </ul>
      )}
      <div className="inline-note management-notice">
        <ShieldCheck size={17} aria-hidden="true" />
        Deactivated categories stay on existing records but can’t be chosen for new expenses.
      </div>

      {dialog?.kind === "edit" && <CategoryFormDialog category={dialog.category} onClose={() => setDialog(null)} onSaved={done} />}
      {dialog?.kind === "deactivate" && (
        <ConfirmDialog
          title={`Deactivate ${dialog.category.name}?`}
          confirmLabel="Deactivate"
          pendingLabel="Deactivating…"
          failureMessage="We couldn't deactivate this category. Please try again."
          destructive
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            await deactivateCategory(dialog.category.id);
            done(`${dialog.category.name} deactivated`);
          }}
        >
          <p>Existing expenses keep this category. It won’t be offered for new expenses. This can’t be undone in the app yet.</p>
        </ConfirmDialog>
      )}
    </>
  );
}
