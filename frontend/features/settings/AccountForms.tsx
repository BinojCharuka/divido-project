"use client";

import { useLayoutEffect, useState, type FormEvent } from "react";
import { FormError } from "@/components/feedback/FieldError";
import { InputField } from "@/components/forms/InputField";
import { useAppShell } from "@/components/layout/AppShellContext";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/client";
import { changePassword, deleteAccount, updateDisplayName } from "@/lib/api/profile";
import { useAuth } from "@/lib/auth/AuthProvider";
import { validateDisplayName, validateNewPassword, type FieldErrors } from "@/lib/auth/validation";
import { useFocusFirstInvalid } from "@/lib/useFocusFirstInvalid";

const FALLBACK = "Something went wrong. Please try again.";

function failure(error: unknown): { message: string | null; fieldErrors: FieldErrors } {
  if (!(error instanceof ApiError)) return { message: FALLBACK, fieldErrors: {} };
  const fieldErrors = error.kind === "validation" ? { ...error.fieldErrors } : {};
  // A field error already says what is wrong; repeat the summary only without one.
  return { message: Object.keys(fieldErrors).length > 0 ? null : error.message, fieldErrors };
}

/** PROFILE-002 (DEC-043). The display name is the only editable profile field. */
export function DisplayNameForm() {
  const { user, updateUser } = useAuth();
  const { notify } = useAppShell();
  const saved = user?.displayName ?? "";
  const [value, setValue] = useState(saved);
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [failedSubmits, setFailedSubmits] = useState(0);
  const formRef = useFocusFirstInvalid(failedSubmits);
  const unchanged = value.trim() === saved;

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || unchanged) return;
    const message = validateDisplayName(value);
    setError(message);
    setFormError(null);
    if (message) {
      setFailedSubmits((n) => n + 1);
      return;
    }
    setPending(true);
    try {
      const profile = await updateDisplayName(value.trim());
      updateUser({ displayName: profile.displayName });
      setValue(profile.displayName);
      notify("Your name has been updated.");
    } catch (err) {
      const { message: summary, fieldErrors } = failure(err);
      setError(fieldErrors.displayName);
      setFormError(summary);
      setFailedSubmits((n) => n + 1);
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="account-form" aria-busy={pending}>
      <FormError message={formError} />
      <InputField
        label="Display name"
        name="displayName"
        autoComplete="name"
        maxLength={100}
        value={value}
        onValueChange={setValue}
        error={error}
        hint="Shown in the app. Your email address stays the same."
      />
      <div className="account-form-actions">
        <Button type="submit" variant="primary" loading={pending} disabled={unchanged}>
          {pending ? "Saving…" : "Save name"}
        </Button>
      </div>
    </form>
  );
}

/** PROFILE-004 (DEC-043). Needs the current password; other sessions end. */
export function PasswordForm({ onDone }: { onDone: () => void }) {
  const { notify } = useAppShell();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [failedSubmits, setFailedSubmits] = useState(0);
  const formRef = useFocusFirstInvalid(failedSubmits);

  // Next.js keeps a page mounted but hidden after navigating away; don't keep passwords in it.
  useLayoutEffect(
    () => () => {
      setCurrent("");
      setNext("");
      setConfirm("");
    },
    [],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const found = validateNewPassword(next, confirm);
    if (!current) found.currentPassword = "Enter your current password.";
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) {
      setFailedSubmits((n) => n + 1);
      return;
    }
    setPending(true);
    try {
      await changePassword(current, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      notify("Password changed. Other devices have been signed out.");
      onDone();
    } catch (err) {
      const { message, fieldErrors } = failure(err);
      setErrors(fieldErrors);
      setFormError(message);
      if (fieldErrors.currentPassword) setCurrent("");
      setFailedSubmits((n) => n + 1);
    } finally {
      setPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate aria-busy={pending}>
      <FormError message={formError} />
      <InputField
        label="Current password"
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        value={current}
        onValueChange={setCurrent}
        error={errors.currentPassword}
      />
      <InputField
        label="New password"
        name="newPassword"
        type="password"
        autoComplete="new-password"
        value={next}
        onValueChange={setNext}
        error={errors.newPassword}
        hint="At least 8 characters."
      />
      <InputField
        label="Confirm new password"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        value={confirm}
        onValueChange={setConfirm}
        error={errors.confirmPassword}
      />
      <div className="account-form-actions">
        <Button type="submit" variant="primary" loading={pending}>
          {pending ? "Changing password…" : "Change password"}
        </Button>
      </div>
    </form>
  );
}

/** PROFILE-005 (DEC-046). Password plus the word DELETE; everything goes at once. */
export function DeleteAccountDialog({ onClose }: { onClose: () => void }) {
  const { endSession } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [failedSubmits, setFailedSubmits] = useState(0);
  const formRef = useFocusFirstInvalid(failedSubmits);
  const confirmed = confirmation.trim() === "DELETE";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const found: FieldErrors = {};
    if (!password) found.password = "Enter your password.";
    if (!confirmed) found.confirmation = "Type DELETE to confirm.";
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) {
      setFailedSubmits((n) => n + 1);
      return;
    }
    setPending(true);
    try {
      await deleteAccount(password, confirmation.trim());
      setPassword("");
      endSession("account-deleted");
    } catch (err) {
      const { message, fieldErrors } = failure(err);
      setErrors(fieldErrors);
      setFormError(message);
      if (fieldErrors.password) setPassword("");
      setFailedSubmits((n) => n + 1);
      setPending(false);
    }
  }

  return (
    <Modal title="Delete your account?" onClose={pending ? () => {} : onClose}>
      <form ref={formRef} onSubmit={onSubmit} noValidate aria-busy={pending}>
        <div className="confirm-content">
          <p>
            This deletes your account and everything in it straight away: budgets, transactions, categories, income
            sources and reflections. It can&apos;t be undone.
          </p>
        </div>
        <FormError message={formError} />
        <InputField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onValueChange={setPassword}
          error={errors.password}
        />
        <InputField
          label="Type DELETE to confirm"
          name="confirmation"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          value={confirmation}
          onValueChange={setConfirmation}
          error={errors.confirmation}
        />
        <div className="modal-actions">
          <Button onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" variant="destructive" loading={pending} disabled={!confirmed}>
            {pending ? "Deleting…" : "Delete account"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
