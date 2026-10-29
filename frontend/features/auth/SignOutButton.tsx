"use client";

import { useState } from "react";
import { FormAlert } from "@/components/feedback/FormAlert";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthProvider";

export function SignOutButton() {
  const { signOut } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setPending(true);
    setError(null);
    try {
      // Reloads the sign-in page on success.
      await signOut();
    } catch (failure) {
      setError(failure instanceof ApiError ? failure.message : "Something went wrong. Please try again.");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <FormAlert tone="error">{error}</FormAlert>}
      <button
        type="button"
        onClick={() => void onClick()}
        disabled={pending}
        className="self-start rounded-md border border-zinc-400 px-4 py-2 font-medium text-zinc-900 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:opacity-60 dark:border-zinc-500 dark:text-zinc-100 dark:hover:bg-zinc-800"
      >
        {pending ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}
