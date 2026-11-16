"use client";

import { useId, type ReactNode } from "react";
import { FieldError } from "@/components/feedback/FieldError";

/** A labelled native select with optional hint and error text. */
export function SelectField({
  label,
  value,
  onChange,
  children,
  error,
  hint,
  required,
  optional,
  disabled,
  name,
  after,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  error?: string;
  hint?: string;
  required?: boolean;
  optional?: boolean;
  disabled?: boolean;
  name?: string;
  after?: ReactNode;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {required && <span className="required"> *</span>}
        {optional && <span className="optional"> Optional</span>}
      </label>
      <select
        id={id}
        name={name}
        value={value}
        disabled={disabled}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
      {after}
      <FieldError id={errorId} message={error} />
      {hint && (
        <span id={hintId} className="field-help">
          {hint}
        </span>
      )}
    </div>
  );
}
