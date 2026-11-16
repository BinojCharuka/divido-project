"use client";

import { X } from "lucide-react";
import { GROUP_META } from "@/components/financial/groups";
import { Button } from "@/components/ui/Button";
import type { Category } from "@/types/category";
import type { IncomeSource } from "@/types/income-source";
import type { TransactionType } from "@/types/transaction";

export interface TransactionFilterValues {
  type?: TransactionType;
  categoryId?: string;
  incomeSourceId?: string;
}

export function isFiltered(f: TransactionFilterValues): boolean {
  return !!(f.type || f.categoryId || f.incomeSourceId);
}

const TYPES = [
  ["All", undefined],
  ["Expenses", "EXPENSE"],
  ["Income", "INCOME"],
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
  const { type, categoryId, incomeSourceId } = values;
  return (
    <>
      <div className="filter-row">
        <div className="segmented-tabs" role="group" aria-label="Transaction type">
          {TYPES.map(([label, value]) => (
            <button
              key={label}
              type="button"
              aria-pressed={type === value}
              className={type === value ? "selected" : ""}
              onClick={() =>
                onChange({
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
              onChange({ type: id ? "EXPENSE" : type, categoryId: id });
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
              onChange({ type: id ? "INCOME" : type, incomeSourceId: id });
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
    </>
  );
}
