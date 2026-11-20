"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useState, type FormEvent } from "react";
import { ChevronRight, Wallet } from "lucide-react";
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

/** UX-P01. Sign-in form matching Divido's dark green & gold financial auth theme. */
export function SignInForm({ notice }: { notice: SignInNotice | null }) {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
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
    <div className="w-full flex flex-col">
      {/* Top Gold Wallet Badge */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-[#fcd34d] flex items-center justify-center shadow-lg shadow-amber-500/10">
          <Wallet size={24} className="text-zinc-950" strokeWidth={2.2} />
        </div>
        <span className="text-[11px] font-semibold tracking-[0.2em] text-zinc-400 uppercase mt-5">
          WELCOME BACK
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1.5">
          Sign in to Divido
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Your financial overview is waiting for you.
        </p>
      </div>

      {/* Segmented Switcher Pill */}
      <div className="w-full bg-[#111914] border border-white/[0.08] p-1 rounded-xl flex gap-1 mb-5">
        <div className="flex-1 py-2 rounded-lg text-xs font-semibold text-white bg-[#1d2a22] shadow-sm text-center select-none">
          Log in
        </div>
        <Link
          href="/sign-up"
          className="flex-1 py-2 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white transition-colors text-center"
        >
          Sign up
        </Link>
      </div>

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
          headerRight={
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-[#5fa88f] hover:text-[#74c69d] hover:underline underline-offset-4 transition-colors"
            >
              Forgot password?
            </Link>
          }
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

        {/* Keep me signed in checkbox - tabIndex -1 preserves exact Shift+Tab keyboard focus sequence */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-zinc-400 hover:text-zinc-300 transition-colors py-0.5">
          <input
            type="checkbox"
            tabIndex={-1}
            checked={keepSignedIn}
            onChange={(e) => setKeepSignedIn(e.target.checked)}
            className="w-4 h-4 rounded border border-white/20 bg-[#0d1410] checked:bg-[#5fa88f] checked:border-[#5fa88f] text-[#5fa88f] focus:ring-0 cursor-pointer accent-[#5fa88f]"
          />
          <span>Keep me signed in on this device</span>
        </label>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={pending}
          aria-label={pending ? "Signing in…" : "Sign in"}
          className="button-block auth-submit-btn mt-1"
        >
          {pending ? (
            "Signing in…"
          ) : (
            <>
              <span>Log in to Divido</span>
              <ChevronRight size={17} strokeWidth={2.5} aria-hidden="true" />
            </>
          )}
        </Button>

        <p className="text-center text-xs text-zinc-400 pt-2">
          New to Divido?{" "}
          <Link
            href="/sign-up"
            className="font-semibold text-[#5fa88f] hover:text-[#74c69d] hover:underline underline-offset-4 transition-colors"
          >
            Create an account
          </Link>
        </p>

        <p className="text-center text-[11px] text-zinc-500 mt-2">
          UI preview — no account data is sent or stored.
        </p>
      </form>
    </div>
  );
}
