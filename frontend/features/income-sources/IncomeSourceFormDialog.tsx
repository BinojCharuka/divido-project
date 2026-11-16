"use client";

import { useState, type FormEvent } from "react";
import { FormError } from "@/components/feedback/FieldError";
import { InputField } from "@/components/forms/InputField";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/client";
import { createIncomeSource, updateIncomeSource } from "@/lib/api/income-sources";
import type { IncomeSource } from "@/types/income-source";

const NAME_MAX = 100;

/** Adds an income source, or renames one. */
export function IncomeSourceFormDialog({
  source,
  onClose,
  onSaved,
}: {
  source: IncomeSource | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [name, setName] = useState(source?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setFieldError("Enter a name for this income source.");
      return;
    }
    if (source && trimmed === source.name) return onClose();
    setPending(true);
    setError(null);
    setFieldError(undefined);
    try {
      if (source) {
        await updateIncomeSource(source.id, { name: trimmed });
        onSaved("Income source renamed");
      } else {
        await createIncomeSource({ name: trimmed });
        onSaved("Income source added");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setFieldError(err.fieldErrors.name);
        setError(err.kind === "conflict" ? "You already have an income source with this name." : err.message);
      } else {
        setError("We couldn't save this income source. Please try again.");
      }
      setPending(false);
    }
  }

  return (
    <Modal title={source ? "Rename income source" : "Add income source"} onClose={onClose}>
      <form onSubmit={submit} noValidate aria-busy={pending}>
        <FormError message={error} />
        <InputField
          label="Income source name"
          name="name"
          value={name}
          maxLength={NAME_MAX}
          autoFocus
          required
          onValueChange={setName}
          error={fieldError}
          hint="For example Salary, Freelance or Rent received."
        />
        <div className="modal-actions">
          <Button onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={pending}>
            {pending ? "Saving…" : "Save income source"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
