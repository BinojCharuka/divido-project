"use client";

/** Visual-only filter controls until TX-001 filter semantics are approved and implemented. */
export function TransactionFilters() {
  const filters = ["October 2026", "All types", "All categories"];
  return (
    <fieldset className="flex flex-wrap gap-3" aria-label="Transaction filters">
      <legend className="sr-only">Transaction filters</legend>
      {filters.map((filter) => (
        <button key={filter} type="button" disabled className="min-h-11 rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-medium text-[var(--text-secondary)] disabled:cursor-not-allowed">
          {filter} <span aria-hidden="true">⌄</span>
        </button>
      ))}
    </fieldset>
  );
}
