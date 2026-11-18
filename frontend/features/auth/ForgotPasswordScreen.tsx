"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowLeft, Mail } from "lucide-react";
import { SessionGate } from "@/components/auth/SessionGate";
import { FormAlert } from "@/components/feedback/FormAlert";
import { TextField } from "@/components/forms/TextField";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { requestPasswordReset } from "@/lib/auth/api";
import { validateEmail } from "@/lib/auth/validation";
import { homeFor } from "@/lib/navigation";
import { useFocusFirstInvalid } from "@/lib/useFocusFirstInvalid";

const LINK_CLASS =
  "font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 underline underline-offset-4";

/**
 * DIV-029 (DEC-045). The reply never says whether the email has an account: the
 * same message follows every well-formed request.
 */
function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [failedSubmits, setFailedSubmits] = useState(0);
  const formRef = useFocusFirstInvalid(failedSubmits);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const value = email.trim();
    const message = validateEmail(value);
    setError(message);
    setFormError(null);
    if (message) {
      setFailedSubmits((n) => n + 1);
      return;
    }
    setPending(true);
    try {
      await requestPasswordReset(value);
      setSentTo(value);
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null;
      setError(apiError?.kind === "validation" ? apiError.fieldErrors.email : undefined);
      setFormError(apiError?.message ?? "Something went wrong. Please try again.");
      setFailedSubmits((n) => n + 1);
    } finally {
      setPending(false);
    }
  }

  if (sentTo) {
    return (
      <div className="flex flex-col gap-4">
        <FormAlert tone="info">
          If an account exists for {sentTo}, we&apos;ve sent it a link to choose a new password. The link works for 30
          minutes.
        </FormAlert>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Nothing arrived? Check your spam folder, or{" "}
          <button type="button" className={`${LINK_CLASS} cursor-pointer`} onClick={() => setSentTo(null)}>
            try again
          </button>
          .
        </p>
        <Link href="/sign-in" className={`${LINK_CLASS} text-sm inline-flex items-center gap-1.5 self-start`}>
          <ArrowLeft size={14} aria-hidden="true" /> Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-4" aria-busy={pending}>
      {formError && <FormAlert tone="error">{formError}</FormAlert>}
      <TextField
        label="Email address"
        type="email"
        name="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={error}
        icon={<Mail size={17} />}
      />
      <Button type="submit" variant="primary" size="lg" loading={pending} className="button-block">
        {pending ? "Sending…" : "Send reset link"}
      </Button>
      <p className="text-center text-xs text-zinc-500 dark:text-zinc-400 pt-1">
        Remembered it?{" "}
        <Link href="/sign-in" className={LINK_CLASS}>
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function ForgotPasswordScreen() {
  const { user } = useAuth();
  return (
    <AuthLayout title="Forgot your password?" subtitle="Enter your email and we'll send you a link to choose a new one.">
      <SessionGate require="signed-out" redirectTo={homeFor(user)}>
        <ForgotPasswordForm />
      </SessionGate>
    </AuthLayout>
  );
}
