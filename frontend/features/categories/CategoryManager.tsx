"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ConfirmDialog } from "@/components/feedback/ConfirmDialog";
import { EmptyState } from "@/components/feedback/EmptyState";
import { FormAlert } from "@/components/feedback/FormAlert";
import { TransactionListSkeleton } from "@/components/feedback/LoadingSkeleton";
import { KakeiboGroupBadge } from "@/components/financial/KakeiboGroupBadge";
import { SelectField } from "@/components/forms/SelectField";
import { TextField } from "@/components/forms/TextField";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createCategory, deactivateCategory, listCategories, updateCategory } from "@/lib/api/categories";
import { ApiError } from "@/lib/api/client";
import { KAKEIBO_GROUPS, type Category, type KakeiboGroup } from "@/types/category";

const NAME_MAX = 100;

/** ApiError messages are safe to show: server envelopes, or the client's own network/server copy. */
function errorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

/** Validates a category form; the backend re-validates and has the final word. */
function validate(name: string, group: string): Record<string, string> {
  const errors: Record<string, string> = {};
  const trimmed = name.trim();
  if (!trimmed) errors.name = "Please enter a category name.";
  else if (trimmed.length > NAME_MAX) errors.name = `Category name must be ${NAME_MAX} characters or fewer.`;
  if (!group) errors.group = "Please choose a Kakeibo group.";
  return errors;
}

function GroupSelect({
  value,
  onChange,
  error,
  disabled,
}: {
  value: string;
  onChange: (group: string) => void;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <SelectField label="Kakeibo group" value={value} onChange={(e) => onChange(e.target.value)} error={error} disabled={disabled}>
      <option value="">Choose a group</option>
      {KAKEIBO_GROUPS.map((g) => (
        <option key={g.id} value={g.id}>
          {g.label}
        </option>
      ))}
    </SelectField>
  );
}

/**
 * Category management (DEC-013): the three global defaults are listed read-only;
 * the user's own custom categories can be created, renamed, regrouped and
 * deactivated. The list is refreshed from the server after every confirmed change.
 */
export function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [group, setGroup] = useState("");
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editGroup, setEditGroup] = useState("");
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [editError, setEditError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [deactivating, setDeactivating] = useState<Category | null>(null);
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
        const items = await listCategories({ includeInactive: showInactive });
        if (active) setCategories(items);
      } catch (error) {
        if (active) setLoadError(errorMessage(error, "Could not load categories."));
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
    const errors = validate(name, group);
    setCreateErrors(errors);
    setCreateError(null);
    setNotice(null);
    if (Object.keys(errors).length > 0) return;

    setCreating(true);
    try {
      const created = await createCategory({ name: name.trim(), group: group as KakeiboGroup });
      setName("");
      setGroup("");
      setNotice(`Category "${created.name}" created.`);
      reload();
    } catch (error) {
      if (error instanceof ApiError) setCreateErrors(error.fieldErrors);
      setCreateError(errorMessage(error, "Could not create the category. Please try again."));
    } finally {
      setCreating(false);
    }
  }

  function startEdit(category: Category) {
    setEditingId(category.id);
    setEditName(category.name);
    setEditGroup(category.group);
    setEditErrors({});
    setEditError(null);
    setNotice(null);
  }

  async function handleSave(event: FormEvent, category: Category) {
    event.preventDefault();
    if (saving) return;
    const errors = validate(editName, editGroup);
    setEditErrors(errors);
    setEditError(null);
    if (Object.keys(errors).length > 0) return;

    const changes: { name?: string; group?: KakeiboGroup } = {};
    if (editName.trim() !== category.name) changes.name = editName.trim();
    if (editGroup !== category.group) changes.group = editGroup as KakeiboGroup;
    if (Object.keys(changes).length === 0) {
      setEditingId(null);
      return;
    }

    setSaving(true);
    try {
      const updated = await updateCategory(category.id, changes);
      setEditingId(null);
      setNotice(`Category "${updated.name}" updated.`);
      reload();
    } catch (error) {
      if (error instanceof ApiError) setEditErrors(error.fieldErrors);
      setEditError(errorMessage(error, "Could not update the category. Please try again."));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!deactivating) return;
    setDeactivatePending(true);
    setDeactivateError(null);
    try {
      await deactivateCategory(deactivating.id);
      setNotice(`Category "${deactivating.name}" deactivated.`);
      setDeactivating(null);
      reload();
    } catch (error) {
      setDeactivateError(errorMessage(error, "Could not deactivate the category. Please try again."));
      setDeactivating(null);
    } finally {
      setDeactivatePending(false);
    }
  }

  const defaults = categories.filter((c) => c.isDefault);
  const custom = categories.filter((c) => !c.isDefault);

  return (
    <div className="flex flex-col gap-6">
      {notice && <FormAlert tone="info">{notice}</FormAlert>}
      {deactivateError && <FormAlert tone="error">{deactivateError}</FormAlert>}

      <Card>
        <form onSubmit={handleCreate} noValidate className="flex flex-col gap-4" aria-label="Create category">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Add a custom category</h2>
          {createError && <FormAlert tone="error">{createError}</FormAlert>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TextField
              label="Category name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={createErrors.name}
              maxLength={NAME_MAX}
              disabled={creating}
            />
            <GroupSelect value={group} onChange={setGroup} error={createErrors.group} disabled={creating} />
          </div>
          <Button type="submit" variant="primary" loading={creating} className="self-end">
            Add category
          </Button>
        </form>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Your categories</h2>
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
      ) : (
        <>
          <section aria-labelledby="default-categories-heading" className="flex flex-col gap-2">
            <h3 id="default-categories-heading" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Default categories
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Shared by everyone and cannot be changed.</p>
            <ul className="flex flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">
              {defaults.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 p-4">
                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{c.name}</span>
                  <div className="flex items-center gap-2">
                    <KakeiboGroupBadge group={c.group} size="sm" />
                    <span className="text-[11px] uppercase tracking-wider text-zinc-500">Default</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="custom-categories-heading" className="flex flex-col gap-2">
            <h3 id="custom-categories-heading" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Custom categories
            </h3>
            {custom.length === 0 ? (
              <EmptyState
                title="No custom categories yet"
                description="Add one above when the default categories don't fit how you spend."
              />
            ) : (
              <ul className="flex flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 divide-y divide-zinc-100 dark:divide-zinc-800">
                {custom.map((c) =>
                  editingId === c.id ? (
                    <li key={c.id} className="p-4">
                      <form onSubmit={(e) => void handleSave(e, c)} noValidate className="flex flex-col gap-3" aria-label={`Edit ${c.name}`}>
                        {editError && <FormAlert tone="error">{editError}</FormAlert>}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <TextField
                            label="Category name"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            error={editErrors.name}
                            maxLength={NAME_MAX}
                            disabled={saving}
                          />
                          <GroupSelect value={editGroup} onChange={setEditGroup} error={editErrors.group} disabled={saving} />
                        </div>
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
                    <li key={c.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{c.name}</span>
                        <KakeiboGroupBadge group={c.group} size="sm" />
                        {!c.active && <span className="text-[11px] uppercase tracking-wider text-zinc-500">Inactive</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="secondary" size="sm" onClick={() => startEdit(c)} aria-label={`Edit ${c.name}`}>
                          Edit
                        </Button>
                        {c.active && (
                          <Button
                            type="button"
                            variant="tertiary"
                            size="sm"
                            onClick={() => {
                              setDeactivateError(null);
                              setNotice(null);
                              setDeactivating(c);
                            }}
                            aria-label={`Deactivate ${c.name}`}
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
          </section>
        </>
      )}

      <ConfirmDialog
        open={deactivating !== null}
        onClose={() => setDeactivating(null)}
        onConfirm={() => void handleDeactivate()}
        title="Deactivate category"
        description={`"${deactivating?.name ?? ""}" will no longer be offered for new expenses. Existing transactions keep it.`}
        confirmLabel="Deactivate"
        destructive
        loading={deactivatePending}
      />
    </div>
  );
}
