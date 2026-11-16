"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { FormError } from "@/components/feedback/FieldError";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ApiError } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/AuthProvider";

/** Confirms sign-out. On success AuthProvider reloads the sign-in page. */
export function SignOutDialog({ onClose }: { onClose: () => void }) {
  const { signOut } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setPending(true);
    setError(null);
    try {
      await signOut();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "We couldn't sign you out. Please try again.");
      setPending(false);
    }
  }

  return (
    <Modal title="Sign out of Divido?" onClose={onClose}>
      <p className="confirm-content">This ends your session on this device.</p>
      <FormError message={error} />
      <div className="modal-actions">
        <Button onClick={onClose} disabled={pending}>
          Stay here
        </Button>
        <Button variant="destructive" onClick={() => void confirm()} loading={pending}>
          <LogOut size={16} aria-hidden="true" />
          {pending ? "Signing out…" : "Sign out"}
        </Button>
      </div>
    </Modal>
  );
}
