"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, LayoutDashboard, PieChart, Plus, Tags, TrendingUp } from "lucide-react";

export interface MobileNavigationProps {
  onOpenQuickAdd: () => void;
}

export function MobileNavigation({ onOpenQuickAdd }: MobileNavigationProps) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");
  const isBudget = pathname.startsWith("/budget");
  const isTransactions = pathname.startsWith("/transactions");
  const isCategories = pathname.startsWith("/categories");
  const isSources = pathname.startsWith("/income-sources");

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed left-0 right-0 mx-auto bottom-3.5 z-40 w-[calc(100%-24px)] max-w-md h-[58px] px-2 bg-white/94 dark:bg-zinc-950/94 backdrop-blur-xl border border-white/80 dark:border-white/10 rounded-full shadow-[0_16px_36px_-6px_rgba(15,23,42,0.16)] dark:shadow-[0_18px_40px_-6px_rgba(0,0,0,0.7)] flex items-center justify-around"
    >
      <div className="flex items-center justify-around w-full">
        {/* Dashboard & budget */}
        <Link
          href="/dashboard"
          aria-current={isDashboard ? "page" : undefined}
          className={`flex flex-col items-center justify-center gap-0.5 px-2.5 py-1 text-[10px] font-medium transition-all rounded-full ${
            isDashboard
              ? "text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 dark:bg-emerald-500/20 ring-1 ring-emerald-500/30"
              : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          <LayoutDashboard size={18} aria-hidden="true" />
          <span>Home</span>
        </Link>
        <Link
          href="/budget"
          aria-current={isBudget ? "page" : undefined}
          className={`flex flex-col items-center justify-center gap-0.5 px-2.5 py-1 text-[10px] font-medium transition-all rounded-full ${
            isBudget
              ? "text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 dark:bg-emerald-500/20 ring-1 ring-emerald-500/30"
              : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          <PieChart size={18} aria-hidden="true" />
          <span>Budget</span>
        </Link>

        {/* Transactions */}
        <Link
          href="/transactions"
          aria-current={isTransactions ? "page" : undefined}
          className={`flex flex-col items-center justify-center gap-0.5 px-2.5 py-1 text-[10px] font-medium transition-all rounded-full ${
            isTransactions
              ? "text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 dark:bg-emerald-500/20 ring-1 ring-emerald-500/30"
              : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          <ArrowLeftRight size={18} aria-hidden="true" />
          <span>History</span>
        </Link>

        {/* Center Prominent Floating Add Button */}
        <button
          type="button"
          onClick={onOpenQuickAdd}
          aria-label="Add transaction"
          className="relative -top-2.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 text-white border-[3px] border-white dark:border-zinc-900 shadow-[0_10px_22px_-3px_rgba(5,150,105,0.55)] active:scale-95 transition-transform"
        >
          <Plus size={22} className="stroke-[2.5]" aria-hidden="true" />
        </button>

        {/* Categories & income sources */}
        <Link
          href="/categories"
          aria-current={isCategories ? "page" : undefined}
          className={`flex flex-col items-center justify-center gap-0.5 px-2.5 py-1 text-[10px] font-medium transition-all rounded-full ${
            isCategories
              ? "text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 dark:bg-emerald-500/20 ring-1 ring-emerald-500/30"
              : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          <Tags size={18} aria-hidden="true" />
          <span>Categories</span>
        </Link>
        <Link
          href="/income-sources"
          aria-current={isSources ? "page" : undefined}
          className={`flex flex-col items-center justify-center gap-0.5 px-2.5 py-1 text-[10px] font-medium transition-all rounded-full ${
            isSources
              ? "text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 dark:bg-emerald-500/20 ring-1 ring-emerald-500/30"
              : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          <TrendingUp size={18} aria-hidden="true" />
          <span>Sources</span>
        </Link>
      </div>
    </nav>
  );
}
