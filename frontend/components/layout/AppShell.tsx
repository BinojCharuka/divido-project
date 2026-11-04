"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { MobileNavigation } from "./MobileNavigation";
import { PrimaryNavigation } from "./PrimaryNavigation";
import { QuickAddModal } from "./QuickAddModal";

export interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100 antialiased">
      {/* Desktop Navigation */}
      <PrimaryNavigation onOpenQuickAdd={() => setQuickAddOpen(true)} />

      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <Link href="/dashboard" aria-label="Divido Dashboard" className="flex items-center gap-2">
          <img
            src="/webp/logo-fulls.webp"
            alt="Divido"
            className="h-7 w-auto light-only dark:hidden"
          />
          <img
            src="/webp/logo-fulls-dark.webp"
            alt="Divido"
            className="h-7 w-auto dark-only hidden dark:block"
          />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setQuickAddOpen(true)}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800 cursor-pointer"
          >
            + Add
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28 md:pb-12">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNavigation onOpenQuickAdd={() => setQuickAddOpen(true)} />

      {/* Quick Add Modal */}
      <QuickAddModal open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </div>
  );
}
