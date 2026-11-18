"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { FormAlert } from "@/components/feedback/FormAlert";
import { TextField } from "@/components/forms/TextField";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthProvider";
import { validateSignIn, type FieldErrors } from "@/lib/auth/validation";
import { homeFor, type SignInNotice } from "@/lib/navigation";
import { useFocusFirstInvalid } from "@/lib/useFocusFirstInvalid";

const NOTICES: Record<SignInNotice, string> = {
  registered: "Your account has been created. Sign in to continue.",
  "signed-out": "You have signed out.",
  "session-ended": "Your session has ended. Sign in again to continue.",
  "password-reset": "Your password has been changed. Sign in with your new password.",
  "account-deleted": "Your account and all its data have been deleted.",
};

/** UX-P01. Sign-in form, with the way into password recovery (DIV-029). */
export function SignInForm({ notice }: { notice: SignInNotice | null }) {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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
      const signedIn = await signIn(input);
      setPassword("");
      router.replace(homeFor(signedIn));
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null;
      setFieldErrors(apiError?.kind === "validation" ? apiError.fieldErrors : {});
      setFormError(apiError?.message ?? "Something went wrong. Please try again.");
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
        label="Email address"
        aria-label="Email"
        type="email"
        name="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={fieldErrors.email}
        icon={<Mail size={17} />}
      />

      <TextField
        label="Password"
        type={showPassword ? "text" : "password"}
        name="password"
        autoComplete="current-password"
        placeholder="Enter your password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={fieldErrors.password}
        icon={<Lock size={17} />}
        headerRight={
          <Link
            href="/forgot-password"
            className="text-xs font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300 underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        }
        rightAction={
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 focus:outline-hidden p-1 transition-colors cursor-pointer"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
      />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={pending}
        className="button-block"
      >
        {pending ? (
          "Signing in…"
        ) : (
          <>
            Sign in
            <ArrowRight size={16} aria-hidden="true" />
          </>
        )}
      </Button>

      <p className="text-center text-xs text-zinc-500 dark:text-zinc-400 pt-1">
        New to Divido?{" "}
        <Link
          href="/sign-up"
          className="font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 underline underline-offset-4 transition-colors"
        >
          Create an account ↗
        </Link>
      </p>
    </form>
  );
}
