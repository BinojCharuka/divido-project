"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Layers, ShieldCheck, Sparkles } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

interface AuthPageShellProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  children: ReactNode;
}

/** Editorial layout with clean focused island. Mobile shows only the login island. */
export function AuthPageShell({
  title,
  subtitle = "Sign in to a calmer view of your money.",
  children,
}: AuthPageShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-[#faf9f5] text-zinc-900 dark:bg-[#090c0a] dark:text-zinc-100 antialiased relative transition-colors duration-200 selection:bg-emerald-500/20 selection:text-emerald-900 dark:selection:text-emerald-200">
      {/* Background ambient lighting */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_800px_at_50%_35%,rgba(16,185,129,0.06),transparent_70%)] dark:bg-[radial-gradient(circle_900px_at_50%_35%,rgba(16,185,129,0.05),transparent_80%)]"
        aria-hidden="true"
      />

      {/* Top Navbar */}
      <header className="w-full border-b border-zinc-200/60 dark:border-white/[0.06] bg-white/60 dark:bg-[#090c0a]/60 backdrop-blur-md sticky top-0 z-30 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-12 h-16 flex items-center justify-between">
          <Link href="/dashboard" aria-label="Divido Home" className="flex items-center gap-2 group transition-opacity hover:opacity-90">
            <img
              src="/webp/logo-fulls.webp"
              alt="Divido."
              className="h-10 sm:h-11 w-auto light-only dark:hidden transition-all"
            />
            <img
              src="/webp/logo-fulls-dark.webp"
              alt="Divido."
              className="h-10 sm:h-11 w-auto dark-only hidden dark:block transition-all"
            />
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline-block text-xs font-medium text-zinc-500 dark:text-zinc-400 tracking-wide">
              Your personal money space
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Split Section */}
      <main className="flex-1 flex items-center justify-center py-10 lg:py-16 px-4 sm:px-6 lg:px-12">
        <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          
          {/* Left Column: Brand Story - Hidden on mobile, clean & minimal on desktop */}
          <div className="hidden lg:flex lg:col-span-7 flex-col gap-8 max-w-lg pr-4">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-[46px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.14]">
                A clearer mind.<br />
                A more mindful<br />
                <span className="text-emerald-600 dark:text-emerald-400">money life.</span>
              </h1>
              <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed font-normal max-w-md">
                Make room for what matters most.<br />
                Plan, notice, and reflect — one month at a time.
              </p>
            </div>

            <div className="pt-6 border-t border-zinc-200/70 dark:border-white/[0.08] flex flex-col gap-4.5">
              <div className="flex items-start gap-3.5 group">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Sparkles size={16} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    The Kakeibo method
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                    Centuries-old Japanese household mindfulness for modern budgeting.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 group">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Private & credential-free
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                    No bank scraping, no passwords stored. Your personal data stays yours.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5 group">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Layers size={16} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Four intentional pillars
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                    Clear balance across Needs, Wants, Culture, and Unexpected moments.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Auth Card Island - Centered & Solo on mobile */}
          <div className="w-full lg:col-span-5 flex justify-center">
            <div className="w-full max-w-[420px] relative rounded-2xl border border-zinc-200/90 dark:border-white/[0.08] bg-white/90 dark:bg-[#111512]/90 p-7 sm:p-8 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-xl overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-emerald-500/40 before:to-transparent transition-all">
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {title}
                  <span className="text-emerald-500">.</span>
                </h2>
                {subtitle && (
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {subtitle}
                  </p>
                )}
              </div>

              {children}
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-200/60 dark:border-white/[0.06] py-4 px-4 sm:px-6 lg:px-12 mt-auto bg-white/40 dark:bg-[#090c0a]/40">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-400 dark:text-zinc-500 text-center sm:text-left">
          <div>© 2026 Divido</div>
          <div>A little awareness. A little more possibility.</div>
        </div>
      </footer>
    </div>
  );
}
