"use client";

import { useState, type FormEvent } from "react";
import { FormError } from "@/components/feedback/FieldError";
import { GROUP_META, GROUP_ORDER } from "@/components/financial/groups";
import { InputField } from "@/components/forms/InputField";
import { SelectField } from "@/components/forms/SelectField";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { createCategory, updateCategory } from "@/lib/api/categories";
import { ApiError } from "@/lib/api/client";
import type { Category, KakeiboGroup } from "@/types/category";

const NAME_MAX = 100;

/** Adds a category, or edits a custom one. An edit sends only the changed fields. */
export function CategoryFormDialog({
  category,
  onClose,
  onSaved,
}: {
  category: Category | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [group, setGroup] = useState<KakeiboGroup>(category?.group ?? "NEEDS");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setFieldErrors({ name: "Enter a category name." });
      return;
    }
    const changes: { name?: string; group?: KakeiboGroup } = {};
    if (category) {
      if (trimmed !== category.name) changes.name = trimmed;
      if (group !== category.group) changes.group = group;
      if (Object.keys(changes).length === 0) return onClose();
    }
    setPending(true);
    setError(null);
    setFieldErrors({});
    try {
      if (category) {
        await updateCategory(category.id, changes);
        onSaved("Category updated");
      } else {
        await createCategory({ name: trimmed, group });
        onSaved("Category added");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldErrors(err.fieldErrors);
        setError(err.kind === "conflict" ? "You already have a category with this name." : err.message);
      } else {
        setError("We couldn't save this category. Please try again.");
      }
      setPending(false);
    }
  }

  return (
    <Modal title={category ? "Edit category" : "Add category"} onClose={onClose}>
      <form onSubmit={submit} noValidate aria-busy={pending}>
        <FormError message={error} />
        <InputField
          label="Category name"
          name="name"
          value={name}
          maxLength={NAME_MAX}
          autoFocus
          required
          onValueChange={setName}
          error={fieldErrors.name}
        />
        <SelectField
          label="Spending group"
          name="group"
          value={group}
          onChange={(v) => setGroup(v as KakeiboGroup)}
          error={fieldErrors.group}
          hint="A change applies to new entries. Existing records keep their group."
        >
          {GROUP_ORDER.map((g) => (
            <option key={g} value={g}>
              {GROUP_META[g].label}
            </option>
          ))}
        </SelectField>
        <div className="modal-actions">
          <Button onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={pending}>
            {pending ? "Saving…" : "Save category"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
