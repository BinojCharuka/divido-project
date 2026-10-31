"use client";

import { getCurrentMonth, getRecentMonths } from "@/lib/formatting/dates";
import type { TransactionType } from "@/types/transaction";

export interface TransactionFiltersProps {
  currentType?: TransactionType;
  currentMonth?: string; // YYYY-MM
  onTypeChange?: (type?: TransactionType) => void;
  onMonthChange?: (month: string) => void;
}

export function TransactionFilters({
  currentType,
  currentMonth,
  onTypeChange,
  onMonthChange,
}: TransactionFiltersProps = {}) {
  // If no handlers are provided, render visual-only disabled filters
  if (!onTypeChange || !onMonthChange) {
    const filters = ["October 2026", "All types", "All categories"];
    return (
      <fieldset className="flex flex-wrap gap-3" aria-label="Transaction filters">
        <legend className="sr-only">Transaction filters</legend>
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            disabled
            className="min-h-11 rounded-xl border border-[var(--border,#e4e4e7)] bg-white px-4 text-sm font-medium text-[var(--text-secondary,#71717a)] disabled:cursor-not-allowed"
          >
            {filter} <span aria-hidden="true">⌄</span>
          </button>
        ))}
      </fieldset>
    );
  }

  const effectiveMonth = currentMonth ?? getCurrentMonth();
  const currentMonthIso = getCurrentMonth();
  const months = getRecentMonths(6);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
      {/* Type Toggle Tabs */}
      <div
        role="tablist"
        aria-label="Transaction Type Filters"
        className="inline-flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800/80 self-start"
      >
        <button
          type="button"
          role="tab"
          aria-selected={!currentType}
          onClick={() => onTypeChange(undefined)}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
            !currentType
              ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-zinc-100 font-semibold"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          All
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={currentType === "EXPENSE"}
          onClick={() => onTypeChange("EXPENSE")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
            currentType === "EXPENSE"
              ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-zinc-100 font-semibold"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          Expenses
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={currentType === "INCOME"}
          onClick={() => onTypeChange("INCOME")}
          className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
            currentType === "INCOME"
              ? "bg-white text-emerald-800 shadow-xs dark:bg-zinc-900 dark:text-emerald-300 font-semibold"
              : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          Income
        </button>
      </div>

      {/* Month Selector */}
      <div className="flex items-center gap-2">
        <label htmlFor="month-filter-select" className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
          Period:
        </label>
        <select
          id="month-filter-select"
          value={effectiveMonth}
          onChange={(e) => onMonthChange(e.target.value)}
          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          {months.map((m) => (
            <option key={m.val} value={m.val}>
              {m.label} {m.val === currentMonthIso ? "(Current)" : ""}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
