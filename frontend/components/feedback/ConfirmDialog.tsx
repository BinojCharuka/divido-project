"use client";

import { useState, type ReactNode } from "react";
import { FormError } from "@/components/feedback/FieldError";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/client";

/**
 * Asks before a consequential action. The action runs once confirmed; the dialog
 * stays open with the error if the server refuses.
 */
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  pendingLabel,
  failureMessage,
  destructive = false,
  onConfirm,
  onClose,
}: {
  title: string;
  children: ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  failureMessage: string;
  destructive?: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setPending(true);
    setError(null);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : failureMessage);
      setPending(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <div className="confirm-content">{children}</div>
      <FormError message={error} />
      <div className="modal-actions">
        <Button onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button variant={destructive ? "destructive" : "primary"} loading={pending} onClick={() => void confirm()}>
          {pending ? pendingLabel : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
