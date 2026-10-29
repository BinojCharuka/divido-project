"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SignOutButton } from "@/features/auth/SignOutButton";

const NAV_ITEMS = [{ href: "/transactions", label: "Transactions" }] as const;

/** Shared authenticated shell; routes remain session-gated by the transactions layout. */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="border-b border-[var(--border)] bg-[#fcfbf7]">
        <div className="mx-auto flex min-h-18 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/transactions" className="text-xl font-bold tracking-tight text-[var(--foreground)] outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[var(--focus)]">
            Divido
          </Link>
          <nav aria-label="Primary navigation" className="hidden items-center gap-1 sm:flex">
            {NAV_ITEMS.map((item) => {
              const current = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  className={`rounded-lg px-3 py-2 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-[var(--focus)] ${current ? "bg-[#e7f0e9] text-[var(--primary-strong)]" : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"}`}
                >
                  {item.label}
                </Link>
              );
            })}
            <span className="px-3 py-2 text-sm text-[#89918d]" aria-label="Budget coming soon">Budget</span>
            <span className="px-3 py-2 text-sm text-[#89918d]" aria-label="Insights coming soon">Insights</span>
          </nav>
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
      <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 border-t border-[var(--border)] bg-[#fcfbf7]/95 px-4 py-2 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-md justify-around">
          {NAV_ITEMS.map((item) => {
            const current = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return <Link key={item.href} href={item.href} aria-current={current ? "page" : undefined} className={`min-h-11 px-4 py-3 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] ${current ? "text-[var(--primary-strong)]" : "text-[var(--text-secondary)]"}`}>{item.label}</Link>;
          })}
        </div>
      </nav>
    </div>
  );
}
