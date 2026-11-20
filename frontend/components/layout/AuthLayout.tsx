"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Check, KeyRound, Moon, Sun, Wallet } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { useDividoTheme } from "@/lib/theme";

export function PoweredByDivido({ className = "" }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div className="w-8 h-8 rounded-lg bg-[#10b981] flex items-center justify-center p-1.5 shadow-md shadow-emerald-950/40">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-white fill-current" aria-hidden="true">
          <rect x="3" y="10" width="4" height="11" rx="2" />
          <rect x="10" y="3" width="4" height="18" rx="2" />
          <rect x="17" y="7" width="4" height="14" rx="2" />
        </svg>
      </div>
      <div className="flex flex-col text-left leading-none justify-center">
        <span className="text-[10px] text-zinc-400 font-medium tracking-wide">Powered by</span>
        <span className="text-base font-bold text-white tracking-tight mt-0.5">divido</span>
      </div>
    </div>
  );
}

export interface AuthLayoutProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  /** When true, the children render their own custom top badge and headings (e.g. SignInForm / SignUpForm) */
  customHeader?: boolean;
}

/** The modern split-screen auth layout matching Divido's dark green & charcoal financial identity. */
export function AuthLayout({ title, subtitle, children, customHeader = false }: AuthLayoutProps) {
  const { theme, toggleTheme } = useDividoTheme();

  return (
    <div className="min-h-screen w-full flex bg-[#070b09] text-zinc-100 antialiased relative selection:bg-[#5fa88f]/30 overflow-x-hidden font-sans">
      {/* Top right floating theme toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-40">
        <IconButton
          icon={theme === "light" ? Moon : Sun}
          label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          className="icon-button text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md rounded-xl transition-all"
          onClick={toggleTheme}
        />
      </div>

      {/* LEFT PANEL: Hero & Branding (Desktop >= 1024px) */}
      <div className="hidden lg:flex lg:w-1/2 min-h-screen flex-col justify-between p-12 xl:p-16 relative overflow-hidden bg-[#06170f] border-r border-white/[0.06]">
        {/* Ambient background glows */}
        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-[480px] h-[480px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#5fa88f]/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Top Logo */}
        <div className="relative z-10">
          <Link href="/" aria-label="Divido home">
            <PoweredByDivido />
          </Link>
        </div>

        {/* Center Hero Copy & Card Preview */}
        <div className="relative z-10 my-auto py-8 max-w-lg">
          <div className="text-[11px] font-bold tracking-[0.25em] text-[#52b788] uppercase mb-4">
            YOUR MONEY, MADE CALM
          </div>
          <h2 className="text-4xl xl:text-5xl font-bold tracking-tight text-white leading-[1.12] mb-4">
            Small choices.<br />
            <span className="text-[#5fa88f]">Stronger finances.</span>
          </h2>
          <p className="text-sm xl:text-base text-zinc-400 font-normal leading-relaxed max-w-md mb-8">
            Track spending, plan your month, and grow your savings from one beautifully simple workspace.
          </p>

          {/* Floating Card Widget */}
          <div className="w-full max-w-[340px] rounded-2xl bg-[#0a1811]/90 border border-emerald-900/40 p-5 shadow-2xl backdrop-blur-md relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
                Available balance
              </span>
              <div className="w-7 h-7 rounded-lg bg-[#fcd34d] flex items-center justify-center shadow-xs">
                <Wallet size={14} className="text-zinc-950" strokeWidth={2.2} />
              </div>
            </div>
            <div className="text-2xl font-bold text-white tracking-tight mb-4 flex items-center gap-2">
              Rs. • • • • • •
            </div>
            <div className="w-full h-1.5 bg-[#14261d] rounded-full overflow-hidden mb-3">
              <div className="h-full w-[60%] bg-[#5fa88f] rounded-full" />
            </div>
            <div className="flex items-center gap-4 text-xs text-zinc-400">
              <span>Income</span>
              <span>Expenses</span>
            </div>
          </div>
        </div>

        {/* Bottom Trust Badge */}
        <div className="relative z-10 flex items-center gap-2 text-xs text-zinc-400">
          <Check size={14} className="text-[#52b788]" strokeWidth={2.5} />
          <span>Private by design. Simple by choice.</span>
        </div>
      </div>

      {/* RIGHT PANEL: Form Container */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-between bg-[#080d0a] text-zinc-100 p-6 sm:p-10 lg:p-12 relative">
        {/* Soft background ambient radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-emerald-950/20 rounded-full blur-[140px] pointer-events-none" />

        {/* Form Inner */}
        <div className="max-w-[420px] w-full mx-auto my-auto py-6 sm:py-8 z-10">
          {!customHeader && title && (
            <div className="mb-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#fcd34d] flex items-center justify-center shadow-lg shadow-amber-500/10 mx-auto mb-4">
                <KeyRound size={22} className="text-zinc-950" strokeWidth={2.2} />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-zinc-400 leading-relaxed">{subtitle}</p>}
            </div>
          )}
          {children}
        </div>

        {/* Bottom Mobile Branding */}
        <div className="lg:hidden relative z-10 py-6 flex justify-center mt-auto">
          <PoweredByDivido />
        </div>
      </div>
    </div>
  );
}
