"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { InlineError } from "@/components/feedback/InlineError";
import { LoadingPanel } from "@/components/feedback/LoadingPanel";
import { ShowInactiveToggle } from "@/components/forms/ShowInactiveToggle";
import { BackLink } from "@/components/layout/BackLink";
import { useAppShell } from "@/components/layout/AppShellContext";
import { PageHeading } from "@/components/layout/PageHeading";
import { Button } from "@/components/ui/Button";
import { deactivateIncomeSource, listIncomeSources } from "@/lib/api/income-sources";
import { useApiData } from "@/lib/useApiData";
import type { IncomeSource } from "@/types/income-source";
import { IncomeSourceCard } from "./IncomeSourceCard";
import { IncomeSourceFormDialog } from "./IncomeSourceFormDialog";

type Dialog = { kind: "edit"; source: IncomeSource | null } | { kind: "deactivate"; source: IncomeSource } | null;

/** Income source management (INC-001..004). Sources are optional labels (DEC-003). */
export function IncomeSourcesPage() {
  const { notify } = useAppShell();
  const [showInactive, setShowInactive] = useState(false);
  const [dialog, setDialog] = useState<Dialog>(null);
  const list = useApiData(
    () => listIncomeSources({ includeInactive: showInactive }),
    [showInactive],
    "We couldn't load your income sources.",
  );

  const done = (message: string) => {
    setDialog(null);
    list.retry();
    notify(message);
  };

  return (
    <>
      <BackLink href="/settings" label="Settings" />
      <PageHeading
        title="Income sources"
        subtitle="Labels for income you record by hand, not connected bank accounts."
        actions={
          <Button variant="primary" onClick={() => setDialog({ kind: "edit", source: null })}>
            <Plus size={17} aria-hidden="true" />
            Add income source
          </Button>
        }
      />
      <div className="management-toolbar">
        <ShowInactiveToggle checked={showInactive} onChange={setShowInactive} />
      </div>

      {list.status === "loading" && <LoadingPanel label="Loading income sources…" />}
      {list.status === "error" && <InlineError message={list.message} onRetry={list.retry} />}
      {list.status === "ready" && (
        <div className="animate-content-reveal">
          {list.data.length === 0 ? (
            <div className="panel empty-state">
              <h3>No income sources yet</h3>
              <p>Income sources are optional. Add one, such as Salary, to label income you record.</p>
            </div>
          ) : (
            <ul className="source-grid">
              {list.data.map((s) => (
                <IncomeSourceCard
                  key={s.id}
                  source={s}
                  onRename={() => setDialog({ kind: "edit", source: s })}
                  onDeactivate={() => setDialog({ kind: "deactivate", source: s })}
                />
              ))}
            </ul>
          )}
        </div>
      )}

      {dialog?.kind === "edit" && <IncomeSourceFormDialog source={dialog.source} onClose={() => setDialog(null)} onSaved={done} />}
      {dialog?.kind === "deactivate" && (
        <ConfirmDialog
          title={`Deactivate ${dialog.source.name}?`}
          confirmLabel="Deactivate"
          pendingLabel="Deactivating…"
          failureMessage="We couldn't deactivate this income source. Please try again."
          destructive
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            await deactivateIncomeSource(dialog.source.id);
            done(`${dialog.source.name} deactivated`);
          }}
        >
          <p>Income already recorded keeps this source. It won’t be offered for new income.</p>
        </ConfirmDialog>
      )}
    </>
  );
}
