"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { FormAlert } from "@/components/feedback/FormAlert";
import { TextField } from "@/components/forms/TextField";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api/client";
import { confirmPasswordReset } from "@/lib/auth/api";
import { validateNewPassword, type FieldErrors } from "@/lib/auth/validation";
import { reloadTo, signInPath } from "@/lib/navigation";
import { useFocusFirstInvalid } from "@/lib/useFocusFirstInvalid";

const LINK_CLASS =
  "font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 underline underline-offset-4";

/** Reads `#token=` once and removes it from the address bar and history (DEC-045). */
function useResetToken(): string | null | undefined {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const read = useRef(false);
  useEffect(() => {
    if (read.current) return;
    read.current = true;
    const value = new URLSearchParams(window.location.hash.slice(1)).get("token");
    if (window.location.hash) window.history.replaceState(null, "", window.location.pathname);
    setToken(value || null);
  }, []);
  return token;
}

function InvalidLink({ message }: { message: string }) {
  return (
    <div className="flex flex-col gap-4">
      <FormAlert tone="error">{message}</FormAlert>
      <Link href="/forgot-password" className={`${LINK_CLASS} text-sm self-start`}>
        Request a new link
      </Link>
    </div>
  );
}

function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [linkInvalid, setLinkInvalid] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [failedSubmits, setFailedSubmits] = useState(0);
  const formRef = useFocusFirstInvalid(failedSubmits);

  useLayoutEffect(
    () => () => {
      setPassword("");
      setConfirm("");
    },
    [],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const found = validateNewPassword(password, confirm);
    setErrors(found);
    setFormError(null);
    if (Object.keys(found).length > 0) {
      setFailedSubmits((n) => n + 1);
      return;
    }
    setPending(true);
    try {
      await confirmPasswordReset(token, password);
      setPassword("");
      setConfirm("");
      // A full load: any session this browser had has ended on the server.
      reloadTo(signInPath("password-reset"));
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null;
      if (apiError?.code === "PASSWORD_RESET_INVALID") {
        setLinkInvalid(apiError.message);
      } else {
        setErrors(apiError?.kind === "validation" ? { ...apiError.fieldErrors } : {});
        setFormError(apiError?.message ?? "Something went wrong. Please try again.");
        setFailedSubmits((n) => n + 1);
      }
      setPending(false);
    }
  }

  if (linkInvalid) return <InvalidLink message={linkInvalid} />;

  const toggle = (
    <button
      type="button"
      onClick={() => setShow((prev) => !prev)}
      className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 focus:outline-hidden p-1 transition-colors cursor-pointer"
      aria-label={show ? "Hide passwords" : "Show passwords"}
    >
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
  );

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-4" aria-busy={pending}>
      {formError && <FormAlert tone="error">{formError}</FormAlert>}
      <TextField
        label="New password"
        type={show ? "text" : "password"}
        name="newPassword"
        autoComplete="new-password"
        hint="At least 8 characters."
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.newPassword}
        icon={<Lock size={17} />}
        rightAction={toggle}
      />
      <TextField
        label="Confirm new password"
        type={show ? "text" : "password"}
        name="confirmPassword"
        autoComplete="new-password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        error={errors.confirmPassword}
        icon={<Lock size={17} />}
      />
      <Button type="submit" variant="primary" size="lg" loading={pending} className="button-block">
        {pending ? "Saving…" : "Set new password"}
      </Button>
    </form>
  );
}

/** DIV-029. Opened from the emailed link; signs out every session of the account. */
export function ResetPasswordScreen() {
  const token = useResetToken();
  return (
    <AuthLayout title="Choose a new password" subtitle="You'll sign in with it next. Other devices will be signed out.">
      {token === undefined ? (
        <p role="status" className="text-sm text-zinc-600 dark:text-zinc-400">
          Checking your link…
        </p>
      ) : token === null ? (
        <InvalidLink message="This reset link is incomplete. Request a new one." />
      ) : (
        <ResetPasswordForm token={token} />
      )}
    </AuthLayout>
  );
}
