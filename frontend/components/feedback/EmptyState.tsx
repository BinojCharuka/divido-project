import Link from "next/link";
import { isValidElement, type ReactNode } from "react";

export interface EmptyStateProps {
  title: string;
  description?: string;
  detail?: string;
  icon?: ReactNode;
  action?: { href: string; label: string } | ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  detail,
  icon,
  action,
  className = "",
}: EmptyStateProps) {
  const message = description ?? detail;

  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 ${className}`}
    >
      {icon ? (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/70 dark:text-emerald-400">
          {icon}
        </div>
      ) : (
        <div
          aria-hidden="true"
          className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-[#e7f0e9] text-xl text-[var(--primary-strong)] dark:bg-emerald-950/70 dark:text-emerald-400"
        >
          ◌
        </div>
      )}
      <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
      {message && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">{message}</p>}
      {action && (
        <div className="mt-5">
          {typeof action === "object" && action !== null && !isValidElement(action) && "href" in action ? (
            <Link
              href={(action as { href: string; label: string }).href}
              className="inline-flex min-h-11 items-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white outline-none ring-offset-2 transition hover:bg-emerald-700 focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              {(action as { href: string; label: string }).label}
            </Link>
          ) : (
            action as ReactNode
          )}
        </div>
      )}
    </div>
  );
}
