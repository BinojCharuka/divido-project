"use client";

import { useId } from "react";
import { FieldError } from "@/components/feedback/FieldError";
import { cleanNumberString } from "@/lib/formatting/money";

/**
 * A labelled LKR amount input. It keeps the raw text the user typed (digits and one
 * dot only); validation and conversion stay with the caller.
 */
export function MoneyField({
  label,
  value,
  onChange,
  error,
  disabled,
  required,
  autoFocus,
  name,
  accessibleLabel,
  variant = "compact",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  name?: string;
  /** A fuller name for screen readers when the visible label is short. */
  accessibleLabel?: string;
  variant?: "compact" | "large";
}) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required && <span className="required"> *</span>}
      </label>
      <div className={variant === "large" ? "money-input" : "compact-money"}>
        <span aria-hidden="true">LKR</span>
        <input
          id={id}
          name={name}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          placeholder="0.00"
          value={value}
          disabled={disabled}
          autoFocus={autoFocus}
          aria-label={accessibleLabel}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          onChange={(e) => onChange(cleanNumberString(e.target.value))}
        />
      </div>
      <FieldError id={errorId} message={error} />
    </div>
  );
}
