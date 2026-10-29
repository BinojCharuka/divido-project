import Link from "next/link";
import { type ReactNode } from "react";

/** Clear no-data state for an API-backed page before it has records to display. */
export function EmptyState({ title, detail, action }: { title: string; detail: string; action?: { href: string; label: string }; icon?: ReactNode }) {
  return (
    <section className="rounded-2xl border border-dashed border-[var(--border)] bg-white px-6 py-12 text-center shadow-sm">
      <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-[#e7f0e9] text-xl text-[var(--primary-strong)]" aria-hidden="true">
        ◌
      </div>
      <h2 className="text-lg font-semibold text-[var(--foreground)]">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--text-secondary)]">{detail}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white outline-none ring-offset-2 transition hover:bg-[var(--primary-strong)] focus-visible:ring-2 focus-visible:ring-[var(--focus)]"
        >
          {action.label}
        </Link>
      )}
    </section>
  );
}
