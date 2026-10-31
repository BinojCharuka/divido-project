import { useId, type InputHTMLAttributes } from "react";

export interface MoneyInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type"> {
  label: string;
  hint?: string;
  error?: string;
}

export function MoneyInput({ label, hint, error, className = "", ...input }: MoneyInputProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
        {label}
      </label>
      <div className="relative flex items-center">
        <span
          aria-hidden="true"
          className="absolute left-3 select-none text-sm font-semibold tracking-wide text-zinc-500 dark:text-zinc-400"
        >
          LKR
        </span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="w-full rounded-lg border border-zinc-300 bg-white pl-13 pr-4 py-2.5 text-base font-mono tabular-nums text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 aria-invalid:border-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus-visible:ring-emerald-400 dark:aria-invalid:border-red-400 transition-colors"
          {...input}
        />
      </div>
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
