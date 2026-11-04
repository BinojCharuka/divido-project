"use client";

import { getCurrentMonth, getRecentMonths } from "@/lib/formatting/dates";
import type { Category } from "@/types/category";
import type { IncomeSource } from "@/types/income-source";
import type { TransactionType } from "@/types/transaction";

/**
 * Filters supported by GET /api/v1/transactions (docs/05-api/transactions-api.md):
 * month (as a from/to date range), type, categoryId and incomeSourceId.
 */
export interface TransactionFilterValues {
  month: string; // YYYY-MM
  type?: TransactionType;
  categoryId?: string;
  incomeSourceId?: string;
}

export interface TransactionFiltersProps {
  values: TransactionFilterValues;
  onChange: (next: TransactionFilterValues) => void;
  /** Categories and income sources available as filter options, including inactive ones. */
  categories?: Category[];
  incomeSources?: IncomeSource[];
  /** Set when the filter options could not be loaded. */
  optionsError?: string | null;
}

const TYPE_TABS: { label: string; value?: TransactionType }[] = [
  { label: "All", value: undefined },
  { label: "Expenses", value: "EXPENSE" },
  { label: "Income", value: "INCOME" },
];

const selectClass =
  "w-full sm:w-auto min-h-9 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";

export function isFiltered(values: TransactionFilterValues): boolean {
  return (
    values.month !== getCurrentMonth() || !!values.type || !!values.categoryId || !!values.incomeSourceId
  );
}

export function TransactionFilters({
  values,
  onChange,
  categories = [],
  incomeSources = [],
  optionsError,
}: TransactionFiltersProps) {
  const currentMonthIso = getCurrentMonth();
  const months = getRecentMonths(12);
  if (!months.some((m) => m.val === values.month)) {
    months.push({ val: values.month, label: values.month });
  }

  // A category only applies to expenses and an income source only to income, so
  // each filter is offered only when its type is possible and is reset when the
  // type rules it out.
  const showCategory = values.type !== "INCOME";
  const showIncomeSource = values.type !== "EXPENSE";

  function setType(type?: TransactionType) {
    onChange({
      ...values,
      type,
      categoryId: type === "INCOME" ? undefined : values.categoryId,
      incomeSourceId: type === "EXPENSE" ? undefined : values.incomeSourceId,
    });
  }

  return (
    <div className="flex flex-col gap-3 mb-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div
          role="tablist"
          aria-label="Transaction Type Filters"
          className="inline-flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800/80 self-start"
        >
          {TYPE_TABS.map((tab) => {
            const selected = values.type === tab.value;
            return (
              <button
                key={tab.label}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setType(tab.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  selected
                    ? "bg-white text-zinc-900 shadow-xs dark:bg-zinc-900 dark:text-zinc-100 font-semibold"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="month-filter-select" className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Period:
          </label>
          <select
            id="month-filter-select"
            value={values.month}
            onChange={(e) => onChange({ ...values, month: e.target.value })}
            className={selectClass}
          >
            {months.map((m) => (
              <option key={m.val} value={m.val}>
                {m.label} {m.val === currentMonthIso ? "(Current)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
        {showCategory && (
          <div className="flex items-center gap-2">
            <label htmlFor="category-filter-select" className="text-xs text-zinc-500 dark:text-zinc-400 font-medium shrink-0">
              Category:
            </label>
            <select
              id="category-filter-select"
              value={values.categoryId ?? ""}
              onChange={(e) => onChange({ ...values, categoryId: e.target.value || undefined })}
              className={selectClass}
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.active ? c.name : `${c.name} (inactive)`}
                </option>
              ))}
            </select>
          </div>
        )}

        {showIncomeSource && (
          <div className="flex items-center gap-2">
            <label htmlFor="income-source-filter-select" className="text-xs text-zinc-500 dark:text-zinc-400 font-medium shrink-0">
              Income source:
            </label>
            <select
              id="income-source-filter-select"
              value={values.incomeSourceId ?? ""}
              onChange={(e) => onChange({ ...values, incomeSourceId: e.target.value || undefined })}
              className={selectClass}
            >
              <option value="">All income sources</option>
              {incomeSources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.active ? s.name : `${s.name} (inactive)`}
                </option>
              ))}
            </select>
          </div>
        )}

        {isFiltered(values) && (
          <button
            type="button"
            onClick={() => onChange({ month: currentMonthIso })}
            className="self-start sm:self-auto text-xs font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 underline underline-offset-4 px-1 py-1.5 cursor-pointer"
          >
            Clear filters
          </button>
        )}
      </div>

      {optionsError && <p className="text-xs text-amber-700 dark:text-amber-400">{optionsError}</p>}
    </div>
  );
}
