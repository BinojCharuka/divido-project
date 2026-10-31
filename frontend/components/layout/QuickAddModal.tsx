"use client";

import Link from "next/link";
import { Dialog } from "@/components/ui/Dialog";

export interface QuickAddModalProps {
  open: boolean;
  onClose: () => void;
}

export function QuickAddModal({ open, onClose }: QuickAddModalProps) {
  return (
    <Dialog open={open} onClose={onClose} title="Add Transaction" description="Choose what type of entry to record:">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        {/* Add Expense Option */}
        <Link
          href="/transactions/new-expense"
          onClick={onClose}
          className="group flex flex-col p-4 rounded-xl border border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800/80 dark:hover:bg-zinc-800 transition-all text-left"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-100 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200 mb-3 group-hover:scale-105 transition-transform">
            <span className="font-bold text-lg">↓</span>
          </div>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">Record Expense</span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Log spending categorized into Kakeibo groups (Needs, Wants, etc.)
          </span>
        </Link>

        {/* Add Income Option */}
        <Link
          href="/transactions/new-income"
          onClick={onClose}
          className="group flex flex-col p-4 rounded-xl border border-emerald-200 hover:border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50 transition-all text-left"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 mb-3 group-hover:scale-105 transition-transform">
            <span className="font-bold text-lg">↑</span>
          </div>
          <span className="font-semibold text-emerald-950 dark:text-emerald-100 text-base">Record Income</span>
          <span className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
            Log earnings from salary, freelance, business, or other sources
          </span>
        </Link>
      </div>
    </Dialog>
  );
}
