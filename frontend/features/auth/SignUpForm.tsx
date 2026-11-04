"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { FormAlert } from "@/components/feedback/FormAlert";
import { TextField } from "@/components/forms/TextField";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api/client";
import { register } from "@/lib/auth/api";
import { validateSignUp, type FieldErrors } from "@/lib/auth/validation";
import { signInPath } from "@/lib/navigation";
import { useFocusFirstInvalid } from "./useFocusFirstInvalid";

/** UX-P02. Registration does not sign the user in (DEC-025); success goes to sign-in. */
export function SignUpForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [pending, setPending] = useState(false);
  const [failedSubmits, setFailedSubmits] = useState(0);
  const formRef = useFocusFirstInvalid(failedSubmits);

  // Next.js keeps a page mounted but hidden after navigating away; don't keep a password in it.
  useLayoutEffect(() => () => setPassword(""), []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const input = { displayName: displayName.trim(), email: email.trim(), password };
    const errors = validateSignUp(input);
    setFieldErrors(errors);
    setFormError(null);
    setConflict(false);
    if (Object.keys(errors).length > 0) {
      setFailedSubmits((n) => n + 1);
      return;
    }

    setPending(true);
    try {
      await register(input);
      setDisplayName("");
      setEmail("");
      setPassword("");
      setPending(false);
      router.push(signInPath("registered"));
    } catch (error) {
      const apiError = error instanceof ApiError ? error : null;
      setFieldErrors(apiError?.kind === "validation" ? apiError.fieldErrors : {});
      setFormError(apiError?.message ?? "Something went wrong. Please try again.");
      setConflict(apiError?.kind === "conflict");
      setFailedSubmits((n) => n + 1);
      setPending(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="flex flex-col gap-4" aria-busy={pending}>
      {formError && (
        <FormAlert tone="error">
          {formError}
          {conflict && (
            <>
              {" "}
              <Link href="/sign-in" className="font-medium underline">
                Sign in instead
              </Link>
            </>
          )}
        </FormAlert>
      )}

      <TextField
        label="Name"
        name="displayName"
        autoComplete="name"
        placeholder="Your full name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        error={fieldErrors.displayName}
        icon={<User size={17} />}
      />

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
        autoComplete="new-password"
        placeholder="At least 8 characters"
        hint="At least 8 characters."
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={fieldErrors.password}
        icon={<Lock size={17} />}
        rightAction={
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 focus:outline-hidden p-1 transition-colors cursor-pointer"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
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
        className="group w-full justify-center text-sm font-semibold py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-sm shadow-emerald-950/20 active:scale-[0.99] transition-all duration-150 cursor-pointer"
      >
        {pending ? (
          "Creating account…"
        ) : (
          <span className="flex items-center justify-center gap-2">
            Create account
            <ArrowRight size={16} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
          </span>
        )}
      </Button>

      <p className="text-center text-xs text-zinc-500 dark:text-zinc-400 pt-1">
        Already have an account?{" "}
        <Link
          href="/sign-in"
          className="font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 underline underline-offset-4 transition-colors"
        >
          Sign in ↗
        </Link>
      </p>
    </form>
  );
}
