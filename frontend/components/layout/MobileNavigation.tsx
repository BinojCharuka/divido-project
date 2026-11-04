"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface MobileNavigationProps {
  onOpenQuickAdd: () => void;
}

export function MobileNavigation({ onOpenQuickAdd }: MobileNavigationProps) {
  const pathname = usePathname();
  const isTransactions = pathname.startsWith("/transactions");
  const isCategories = pathname.startsWith("/categories");
  const isSources = pathname.startsWith("/income-sources");

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 px-4 py-2 pb-safe"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {/* Transactions */}
        <Link
          href="/transactions"
          aria-current={isTransactions ? "page" : undefined}
          className={`flex flex-col items-center gap-1 p-2 text-xs font-medium transition-colors ${
            isTransactions
              ? "text-emerald-600 dark:text-emerald-400 font-semibold"
              : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          <span className="text-lg leading-none" aria-hidden="true">
            ☰
          </span>
          <span>Transactions</span>
        </Link>

        {/* Center Prominent Add Button */}
        <button
          type="button"
          onClick={onOpenQuickAdd}
          aria-label="Add transaction"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md active:scale-95 transition-transform"
        >
          <span className="text-2xl font-bold leading-none mb-0.5" aria-hidden="true">
            +
          </span>
        </button>

        {/* Categories & income sources */}
        <Link
          href="/categories"
          aria-current={isCategories ? "page" : undefined}
          className={`flex flex-col items-center gap-1 p-2 text-xs font-medium transition-colors ${
            isCategories
              ? "text-emerald-600 dark:text-emerald-400 font-semibold"
              : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          <span className="text-lg leading-none" aria-hidden="true">
            ◈
          </span>
          <span>Categories</span>
        </Link>
        <Link
          href="/income-sources"
          aria-current={isSources ? "page" : undefined}
          className={`flex flex-col items-center gap-1 p-2 text-xs font-medium transition-colors ${
            isSources
              ? "text-emerald-600 dark:text-emerald-400 font-semibold"
              : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          <span className="text-lg leading-none" aria-hidden="true">
            ↑
          </span>
          <span>Sources</span>
        </Link>
      </div>
    </nav>
  );
}
