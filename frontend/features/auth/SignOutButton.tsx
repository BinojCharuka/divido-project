"use client";

import { useState } from "react";
import { FormAlert } from "@/components/feedback/FormAlert";
import { Button } from "@/components/ui/Button";
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
    <div className="flex flex-col gap-2">
      {error && <FormAlert tone="error">{error}</FormAlert>}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => void onClick()}
        loading={pending}
      >
        {pending ? "Signing out…" : "Sign out"}
      </Button>
    </div>
  );
}
