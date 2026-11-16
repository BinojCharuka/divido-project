"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Layers, Moon, ShieldCheck, Sparkles, Sun } from "lucide-react";
import { Brand } from "@/components/ui/Brand";
import { IconButton } from "@/components/ui/IconButton";
import { useDividoTheme } from "@/lib/theme";

const POINTS = [
  { icon: Sparkles, title: "Plan one month at a time", text: "Set income, a savings target and what each group may spend." },
  { icon: ShieldCheck, title: "Private and manual", text: "No bank connections. You record what you choose to record." },
  { icon: Layers, title: "Four spending groups", text: "Needs, Wants, Culture and Unexpected, side by side." },
];

/** The signed-out layout from the Figma design: brand story on the left, the form card on the right. */
export function AuthLayout({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const { theme, toggleTheme } = useDividoTheme();
  return (
    <div className="min-h-screen flex flex-col bg-[#fbfaf6] text-zinc-900 dark:bg-[#0b0e0c] dark:text-zinc-100 antialiased relative selection:bg-emerald-500/20">
      <header className="w-full border-b border-zinc-200/70 dark:border-zinc-800/70 bg-white/70 dark:bg-[#0e120f]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-16 flex items-center justify-between">
          <Link href="/" aria-label="Divido home" className="flex items-center">
            <Brand />
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Your personal money space
            </span>
            <div className="auth-theme-toggle">
              <IconButton
                icon={theme === "light" ? Moon : Sun}
                label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                className="icon-button theme-toggle"
                onClick={toggleTheme}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center py-8 lg:py-16 px-4 sm:px-6 lg:px-12">
        <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
          <div className="hidden lg:flex lg:col-span-7 flex-col gap-6 max-w-lg">
            <p className="text-4xl lg:text-[46px] font-bold tracking-[-0.03em] text-zinc-900 dark:text-zinc-50 leading-[1.15] text-balance">
              A clearer mind. A more mindful <span className="text-emerald-700 dark:text-emerald-400">money life.</span>
            </p>
            <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-md">
              Plan, notice and reflect, one month at a time.
            </p>
            <ul className="pt-6 border-t border-zinc-200/70 dark:border-white/[0.08] flex flex-col gap-4">
              {POINTS.map(({ icon: Icon, title: pointTitle, text }) => (
                <li key={pointTitle} className="flex items-start gap-3.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    <Icon size={16} aria-hidden="true" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{pointTitle}</div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 leading-relaxed">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="w-full lg:col-span-5 flex justify-center">
            <div className="w-full max-w-[420px] rounded-2xl border border-zinc-200/90 dark:border-white/[0.08] bg-white dark:bg-[#111512] p-7 sm:p-8 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7)]">
              <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{title}</h1>
                {subtitle && <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{subtitle}</p>}
              </div>
              {children}
            </div>
          </div>
        </div>
      </main>

      <footer className="w-full border-t border-zinc-200/70 dark:border-zinc-800/70 py-6 px-6 lg:px-12 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-600 dark:text-zinc-400">
          <div>© {new Date().getFullYear()} Divido</div>
          <div>Made for a more mindful month.</div>
        </div>
      </footer>
    </div>
  );
}
