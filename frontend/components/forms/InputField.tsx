"use client";

import { useId, type InputHTMLAttributes } from "react";
import { FieldError } from "@/components/feedback/FieldError";

/** A labelled text/date input in the app style, with hint and error text. */
export function InputField({
  label,
  error,
  hint,
  required,
  optional,
  onValueChange,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "required"> & {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  optional?: boolean;
  onValueChange: (value: string) => void;
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
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        onChange={(e) => onValueChange(e.target.value)}
        {...props}
      />
      <FieldError id={errorId} message={error} />
      {hint && (
        <span id={hintId} className="field-help">
          {hint}
        </span>
      )}
    </div>
  );
}
