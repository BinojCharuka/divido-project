"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useState, type FormEvent } from "react";
import { ChevronRight, User } from "lucide-react";
import { FormAlert } from "@/components/feedback/FormAlert";
import { TextField } from "@/components/forms/TextField";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api/client";
import { register } from "@/lib/auth/api";
import { validateSignUp, type FieldErrors } from "@/lib/auth/validation";
import { signInPath } from "@/lib/navigation";
import { useFocusFirstInvalid } from "@/lib/useFocusFirstInvalid";

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
    <div className="w-full flex flex-col">
      {/* Top Gold User Badge */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-[#e2d274] flex items-center justify-center shadow-lg shadow-amber-500/10">
          <User size={24} className="text-[#1c1a0e]" strokeWidth={2.4} />
        </div>
        <span className="text-[11px] font-semibold tracking-[0.2em] text-zinc-400 uppercase mt-5">
          START YOUR JOURNEY
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1.5">
          Create your account
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Start your mindful money journey.
        </p>
      </div>

      {/* Segmented Switcher Pill */}
      <div className="w-full bg-[#121c16] border border-white/[0.07] p-1 rounded-2xl flex gap-1 mb-5">
        <Link
          href="/sign-in"
          className="flex-1 py-2.5 rounded-xl text-xs font-medium text-zinc-400 hover:text-white transition-colors text-center"
        >
          Log in
        </Link>
        <div className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#203429] shadow-xs text-center select-none">
          Sign up
        </div>
      </div>

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
          rightAction={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="text-xs font-semibold text-[#5fa88f] hover:text-[#74c69d] focus:outline-hidden px-1.5 py-0.5 transition-colors cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          }
        />

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={pending}
          className="button-block auth-submit-btn mt-1"
        >
          {pending ? (
            "Creating account…"
          ) : (
            <>
              <span>Create account</span>
              <ChevronRight size={17} strokeWidth={2.5} aria-hidden="true" />
            </>
          )}
        </Button>

        <p className="text-center text-xs text-zinc-400 pt-2">
          Already have an account?{" "}
          <Link
            href="/sign-in"
            className="font-semibold text-[#5fa88f] hover:text-[#74c69d] hover:underline underline-offset-4 transition-colors"
          >
            Sign in ↗
          </Link>
        </p>

        <p className="text-center text-[11px] text-zinc-500 mt-2">
          UI preview — no account data is sent or stored.
        </p>
      </form>
    </div>
  );
}
