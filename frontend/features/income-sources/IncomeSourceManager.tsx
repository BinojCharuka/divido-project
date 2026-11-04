"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { EmptyState } from "@/components/feedback/EmptyState";
import { FormAlert } from "@/components/feedback/FormAlert";
import { TransactionListSkeleton } from "@/components/feedback/LoadingSkeleton";
import { TextField } from "@/components/forms/TextField";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ApiError } from "@/lib/api/client";
import {
  createIncomeSource,
  deactivateIncomeSource,
  listIncomeSources,
  updateIncomeSource,
} from "@/lib/api/income-sources";
import type { IncomeSource } from "@/types/income-source";

const NAME_MAX = 100;

/** ApiError messages are safe to show: server envelopes, or the client's own network/server copy. */
function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

function validateName(name: string): string | undefined {
  const trimmed = name.trim();
  if (!trimmed) return "Please enter a name.";
  if (trimmed.length > NAME_MAX) return `Name must be ${NAME_MAX} characters or fewer.`;
  return undefined;
}

/**
 * Income source management (docs/05-api/income-sources-api.md). Sources are
 * always user-owned and optional on income (DEC-003). The list is refreshed from
 * the server after every confirmed change; nothing is shown as saved before that.
 */
export function IncomeSourceManager() {
  const [sources, setSources] = useState<IncomeSource[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | undefined>();
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editNameError, setEditNameError] = useState<string | undefined>();
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deactivating, setDeactivating] = useState<IncomeSource | null>(null);
  const [deactivatePending, setDeactivatePending] = useState(false);
  const [deactivateError, setDeactivateError] = useState<string | null>(null);

  // Bumping reloadKey re-fetches the list from the server.
  const [reloadKey, setReloadKey] = useState(0);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setLoading(true);
        setLoadError(null);
        const items = await listIncomeSources({ includeInactive: showInactive });
        if (active) setSources(items);
      } catch (error) {
        if (active) setLoadError(errorMessage(error, "Could not load income sources."));
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [showInactive, reloadKey]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    if (creating) return;
    const error = validateName(name);
    setNameError(error);
    setCreateError(null);
    setNotice(null);
    if (error) return;

    setCreating(true);
    try {
      const created = await createIncomeSource({ name: name.trim() });
      setName("");
      setNotice(`Income source "${created.name}" created.`);
      reload();
    } catch (err) {
      if (err instanceof ApiError) setNameError(err.fieldErrors.name);
      setCreateError(errorMessage(err, "Could not create the income source. Please try again."));
    } finally {
      setCreating(false);
    }
  }

  async function handleSave(event: FormEvent, source: IncomeSource) {
    event.preventDefault();
    if (saving) return;
    const error = validateName(editName);
    setEditNameError(error);
    setEditError(null);
    if (error) return;
    if (editName.trim() === source.name) {
      setEditingId(null);
      return;
    }

    setSaving(true);
    try {
      const updated = await updateIncomeSource(source.id, { name: editName.trim() });
      setEditingId(null);
      setNotice(`Income source "${updated.name}" updated.`);
      reload();
    } catch (err) {
      if (err instanceof ApiError) setEditNameError(err.fieldErrors.name);
      setEditError(errorMessage(err, "Could not update the income source. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!deactivating) return;
    setDeactivatePending(true);
    setDeactivateError(null);
    try {
      await deactivateIncomeSource(deactivating.id);
      setNotice(`Income source "${deactivating.name}" deactivated.`);
      setDeactivating(null);
      reload();
    } catch (err) {
      setDeactivateError(errorMessage(err, "Could not deactivate the income source. Please try again."));
      setDeactivating(null);
    } finally {
      setDeactivatePending(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {notice && <FormAlert tone="info">{notice}</FormAlert>}
      {deactivateError && <FormAlert tone="error">{deactivateError}</FormAlert>}

      <Card>
        <form onSubmit={handleCreate} noValidate className="flex flex-col gap-4" aria-label="Create income source">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Add an income source</h2>
          {createError && <FormAlert tone="error">{createError}</FormAlert>}
          <TextField
            label="Income source name"
            hint="For example Salary, Freelance or Rental. Income can also be recorded without a source."
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={nameError}
            maxLength={NAME_MAX}
            disabled={creating}
          />
          <Button type="submit" variant="primary" loading={creating} className="self-end">
            Add income source
          </Button>
        </form>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Your income sources</h2>
        <label className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
          Show inactive
        </label>
      </div>

      {loading ? (
        <TransactionListSkeleton count={3} />
      ) : loadError ? (
        <div className="flex flex-col gap-3">
          <FormAlert tone="error">{loadError}</FormAlert>
          <Button variant="secondary" size="sm" className="self-start" onClick={reload}>
            Try again
          </Button>
        </div>
      ) : sources.length === 0 ? (
        <EmptyState
          title="No income sources yet"
          description="Add one above to label where your income comes from. This is optional."
        />
      ) : (
        <ul className="flex flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">
          {sources.map((s) =>
            editingId === s.id ? (
              <li key={s.id} className="p-4">
                <form onSubmit={(e) => void handleSave(e, s)} noValidate className="flex flex-col gap-3" aria-label={`Edit ${s.name}`}>
                  {editError && <FormAlert tone="error">{editError}</FormAlert>}
                  <TextField
                    label="Income source name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    error={editNameError}
                    maxLength={NAME_MAX}
                    disabled={saving}
                  />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={() => setEditingId(null)} disabled={saving}>
                      Cancel
                    </Button>
                    <Button type="submit" variant="primary" size="sm" loading={saving}>
                      Save
                    </Button>
                  </div>
                </form>
              </li>
            ) : (
              <li key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{s.name}</span>
                  {!s.active && <span className="text-[11px] uppercase tracking-wider text-zinc-500">Inactive</span>}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    aria-label={`Edit ${s.name}`}
                    onClick={() => {
                      setEditingId(s.id);
                      setEditName(s.name);
                      setEditNameError(undefined);
                      setEditError(null);
                      setNotice(null);
                    }}
                  >
                    Edit
                  </Button>
                  {s.active && (
                    <Button
                      type="button"
                      variant="tertiary"
                      size="sm"
                      aria-label={`Deactivate ${s.name}`}
                      onClick={() => {
                        setDeactivateError(null);
                        setNotice(null);
                        setDeactivating(s);
                      }}
                    >
                      Deactivate
                    </Button>
                  )}
                </div>
              </li>
            ),
          )}
        </ul>
      )}

      <ConfirmDialog
        open={deactivating !== null}
        onClose={() => setDeactivating(null)}
        onConfirm={() => void handleDeactivate()}
        title="Deactivate income source"
        description={`"${deactivating?.name ?? ""}" will no longer be offered for new income. Existing transactions keep it.`}
        confirmLabel="Deactivate"
        destructive
        loading={deactivatePending}
      />
    </div>
  );
}
