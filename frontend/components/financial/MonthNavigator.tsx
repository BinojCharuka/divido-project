"use client";

import { formatMonthYear, getCurrentMonth, shiftMonth } from "@/lib/formatting/dates";

export interface MonthNavigatorProps {
  month: string; // YYYY-MM
  onChange: (month: string) => void;
  disabled?: boolean;
}

/** Previous / next month controls shared by Budget and Dashboard (DIV-017 month policy). */
export function MonthNavigator({ month, onChange, disabled = false }: MonthNavigatorProps) {
  const label = formatMonthYear(month);
  const previous = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);
  const current = getCurrentMonth();
  const buttonClass =
    "inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-700 transition-colors hover:bg-zinc-100 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800";

  return (
    <nav aria-label="Month" className="flex items-center gap-2">
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(previous)}
        disabled={disabled}
        aria-label={`Previous month, ${formatMonthYear(previous)}`}
      >
        <span aria-hidden="true">‹</span>
      </button>
      <p
        className="min-w-[9.5rem] text-center text-sm font-semibold text-zinc-900 dark:text-zinc-100"
        aria-live="polite"
        data-testid="selected-month"
      >
        {label}
      </p>
      <button
        type="button"
        className={buttonClass}
        onClick={() => onChange(next)}
        disabled={disabled}
        aria-label={`Next month, ${formatMonthYear(next)}`}
      >
        <span aria-hidden="true">›</span>
      </button>
      {month !== current && (
        <button
          type="button"
          onClick={() => onChange(current)}
          disabled={disabled}
          className="ml-1 rounded-lg px-2.5 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-50 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950/60"
        >
          This month
        </button>
      )}
    </nav>
  );
}
