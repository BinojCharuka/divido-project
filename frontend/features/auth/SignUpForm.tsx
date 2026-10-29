"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useState, type FormEvent } from "react";
import { FormAlert } from "@/components/feedback/FormAlert";
import { TextField } from "@/components/forms/TextField";
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
    // The password is sent exactly as typed; the backend never trims it.
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
      // Start fresh if the user comes back to this page.
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
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        error={fieldErrors.displayName}
      />
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
        autoComplete="new-password"
        hint="At least 8 characters."
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={fieldErrors.password}
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white hover:bg-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
      <p className="text-sm text-zinc-700 dark:text-zinc-300">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-medium underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
