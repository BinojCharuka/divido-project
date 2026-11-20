"use client";

import { Search, X } from "lucide-react";
import { GROUP_META } from "@/components/financial/groups";
import { Button } from "@/components/ui/Button";
import type { Category } from "@/types/category";
import type { IncomeSource } from "@/types/income-source";
import type { TransactionType } from "@/types/transaction";

export interface TransactionFilterValues {
  type?: TransactionType;
  categoryId?: string;
  incomeSourceId?: string;
  search?: string;
}

export function isFiltered(f: TransactionFilterValues): boolean {
  return !!(f.type || f.categoryId || f.incomeSourceId || f.search);
}

const TYPES = [
  ["All", undefined],
  ["Income", "INCOME"],
  ["Expenses", "EXPENSE"],
] as const;

/**
 * Type, category and income-source filters. A category implies expenses and an
 * income source implies income, so picking one narrows the type to match.
 */
export function TransactionFilters({
  values,
  onChange,
  categories,
  sources,
  optionsUnavailable,
}: {
  values: TransactionFilterValues;
  onChange: (next: TransactionFilterValues) => void;
  categories: Category[];
  sources: IncomeSource[];
  optionsUnavailable: boolean;
}) {
  const { type, categoryId, incomeSourceId, search = "" } = values;
  return (
    <div className="transaction-filters-container flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
      {/* Search Input matching desktop screenshot 2 and mobile */}
      <div className="relative w-full md:max-w-md">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search transactions"
          aria-label="Search transactions"
          value={search}
          onChange={(e) => onChange({ ...values, search: e.target.value })}
          className="w-full bg-[#0d1611] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-hidden focus:border-emerald-500/50"
        />
        {search && (
          <button
            type="button"
            onClick={() => onChange({ ...values, search: "" })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1 cursor-pointer"
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="filter-row flex flex-wrap items-center gap-2.5">
        <div className="segmented-tabs" role="group" aria-label="Transaction type">
          {TYPES.map(([label, value]) => (
            <button
              key={label}
              type="button"
              aria-pressed={type === value}
              className={type === value ? "selected" : ""}
              onClick={() =>
                onChange({
                  ...values,
                  type: value,
                  categoryId: value === "INCOME" ? undefined : categoryId,
                  incomeSourceId: value === "EXPENSE" ? undefined : incomeSourceId,
                })
              }
            >
              {label}
            </button>
          ))}
        </div>
        {type !== "INCOME" && (
          <select
            aria-label="Filter by category"
            value={categoryId ?? ""}
            disabled={optionsUnavailable}
            onChange={(e) => {
              const id = e.target.value || undefined;
              onChange({ ...values, type: id ? "EXPENSE" : type, categoryId: id });
            }}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {GROUP_META[c.group].label}
                {c.active ? "" : " · inactive"}
              </option>
            ))}
          </select>
        )}
        {type !== "EXPENSE" && (
          <select
            aria-label="Filter by income source"
            value={incomeSourceId ?? ""}
            disabled={optionsUnavailable}
            onChange={(e) => {
              const id = e.target.value || undefined;
              onChange({ ...values, type: id ? "INCOME" : type, incomeSourceId: id });
            }}
          >
            <option value="">All income sources</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.active ? "" : " · inactive"}
              </option>
            ))}
          </select>
        )}
        {isFiltered(values) && (
          <Button variant="ghost" onClick={() => onChange({})}>
            Clear filters <X size={14} aria-hidden="true" />
          </Button>
        )}
      </div>
      {optionsUnavailable && <p className="filter-note">Category and income source filters are unavailable right now.</p>}
    </div>
  );
}
