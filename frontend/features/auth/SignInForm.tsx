"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useState, type FormEvent } from "react";
import { FormAlert } from "@/components/feedback/FormAlert";
import { TextField } from "@/components/forms/TextField";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { validateSignIn, type FieldErrors } from "@/lib/auth/validation";
import type { SignInNotice } from "@/lib/navigation";
import { useFocusFirstInvalid } from "./useFocusFirstInvalid";

export const SIGNED_IN_HOME = "/onboarding";

const NOTICES: Record<SignInNotice, string> = {
  // DEC-025: creating an account does not sign the user in.
  registered: "Your account has been created. Sign in to continue.",
  "signed-out": "You have signed out.",
  "session-ended": "Your session has ended. Sign in again to continue.",
};

/** UX-P01. `notice` explains how the user got here (from the ?notice= query value). */
export function SignInForm({ notice }: { notice: SignInNotice | null }) {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [failedSubmits, setFailedSubmits] = useState(0);
  const formRef = useFocusFirstInvalid(failedSubmits);

  // Next.js keeps a page mounted but hidden after navigating away; don't keep a password in it.
  useLayoutEffect(() => () => setPassword(""), []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const input = { email: email.trim(), password };
    const errors = validateSignIn(input);
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) {
      setFailedSubmits((n) => n + 1);
      return;
    }

    setPending(true);
    try {
      await signIn(input);
      setPassword("");
      router.replace(SIGNED_IN_HOME);
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null;
      setFieldErrors(apiError?.kind === "validation" ? apiError.fieldErrors : {});
      setFormError(apiError?.message ?? "Something went wrong. Please try again.");
      // Never keep a rejected password in the form.
      if (apiError?.kind === "invalid-credentials") setPassword("");
      setFailedSubmits((n) => n + 1);
      setPending(false);
    }
  }

  const banner = notice ? NOTICES[notice] : null;

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-4" aria-busy={pending}>
      {banner && !formError && <FormAlert tone="info">{banner}</FormAlert>}
      {formError && <FormAlert tone="error">{formError}</FormAlert>}
      <TextField
        label="Email"
        type="email"
        name="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={fieldErrors.email}
      />
      <TextField
        label="Password"
        type="password"
        name="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={fieldErrors.password}
      />
      <Button type="submit" variant="primary" size="lg" loading={pending} className="w-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        New to Divido?{" "}
        <Link href="/sign-up" className="font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
