"use client";

import { useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";

/** A short confirmation that hides itself after a few seconds. */
export function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onDismiss, 4500);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;
  return (
    <div className="toast" role="status">
      <CheckCircle2 size={19} aria-hidden="true" />
      <span>{message}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss notification">
        <X size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
