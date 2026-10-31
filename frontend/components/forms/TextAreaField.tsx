import { useId, type TextareaHTMLAttributes } from "react";

export interface TextAreaFieldProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> {
  label: string;
  hint?: string;
  error?: string;
  maxLength?: number;
  currentLength?: number;
}

export function TextAreaField({
  label,
  hint,
  error,
  maxLength,
  currentLength,
  className = "",
  ...textarea
}: TextAreaFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {label}
        </label>
        {maxLength !== undefined && currentLength !== undefined && (
          <span className="text-xs text-zinc-400">
            {currentLength}/{maxLength}
          </span>
        )}
      </div>

      <textarea
        id={id}
        maxLength={maxLength}
        rows={3}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 aria-invalid:border-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus-visible:ring-emerald-400 dark:aria-invalid:border-red-400 transition-colors"
        {...textarea}
      />

      {hint && (
        <p id={hintId} className="text-xs text-zinc-600 dark:text-zinc-400">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
