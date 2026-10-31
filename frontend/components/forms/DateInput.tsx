import { useId, type InputHTMLAttributes } from "react";
import { getTodayIso, getYesterdayIso } from "@/lib/formatting/dates";

export interface DateInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type" | "onChange"> {
  label: string;
  value: string; // ISO date YYYY-MM-DD
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
}

export function DateInput({
  label,
  value,
  onChange,
  hint,
  error,
  className = "",
  ...input
}: DateInputProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  const today = getTodayIso();
  const yesterday = getYesterdayIso();

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {label}
        </label>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onChange(today)}
            className={`text-xs px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
              value === today
                ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700 font-medium"
                : "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => onChange(yesterday)}
            className={`text-xs px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
              value === yesterday
                ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-700 font-medium"
                : "bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
            }`}
          >
            Yesterday
          </button>
        </div>
      </div>

      <input
        id={id}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 aria-invalid:border-red-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus-visible:ring-emerald-400 dark:aria-invalid:border-red-400 transition-colors"
        {...input}
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
