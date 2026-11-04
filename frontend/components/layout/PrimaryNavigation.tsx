"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { SignOutButton } from "@/features/auth/SignOutButton";
import { useAuth } from "@/lib/auth/AuthProvider";

export interface PrimaryNavigationProps {
  onOpenQuickAdd: () => void;
}

export function PrimaryNavigation({ onOpenQuickAdd }: PrimaryNavigationProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const links = [
    { href: "/transactions", label: "Transactions", active: pathname.startsWith("/transactions") },
    { href: "/categories", label: "Categories", active: pathname.startsWith("/categories") },
    { href: "/income-sources", label: "Income sources", active: pathname.startsWith("/income-sources") },
  ];

  return (
    <header className="sticky top-0 z-30 hidden md:block bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/transactions" className="flex items-center gap-2 font-bold text-xl text-zinc-900 dark:text-zinc-100 tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-base">
              D
            </span>
            <span>Divido</span>
          </Link>

          <nav aria-label="Desktop Navigation" className="flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={link.active ? "page" : undefined}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  link.active
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100 font-semibold"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-900"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <span className="px-3 py-2 text-sm text-zinc-400 dark:text-zinc-500 cursor-not-allowed select-none" aria-label="Budget coming soon">
              Budget
            </span>
            <span className="px-3 py-2 text-sm text-zinc-400 dark:text-zinc-500 cursor-not-allowed select-none" aria-label="Insights coming soon">
              Insights
            </span>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onOpenQuickAdd}
            icon={
              <span className="font-bold text-sm" aria-hidden="true">
                +
              </span>
            }
          >
            Add Transaction
          </Button>

          <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800" aria-hidden="true" />

          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-[150px]">
              {user?.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </div>
    </header>
  );
}
