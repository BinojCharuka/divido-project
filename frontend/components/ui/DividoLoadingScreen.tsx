"use client";

import type { HTMLAttributes } from "react";

export interface DividoLoadingScreenProps extends HTMLAttributes<HTMLDivElement> {
  message?: string;
  fullscreen?: boolean;
}

/**
 * Mindful, high-craft Divido loading screen.
 * Displays the official logo with a gentle breathing glow,
 * sleek progress beam, and theme-aware surface lighting.
 */
export function DividoLoadingScreen({
  message = "Opening your personal money space…",
  fullscreen = true,
  className = "",
  role,
  ...props
}: DividoLoadingScreenProps) {
  const resolvedRole = role !== undefined ? role : fullscreen ? "status" : undefined;
  return (
    <div
      role={resolvedRole}
      aria-live={resolvedRole ? "polite" : undefined}
      aria-label={resolvedRole ? "Loading Divido" : undefined}
      className={`${
        fullscreen
          ? "fixed inset-0 min-h-screen z-[99999] bg-[#faf9f5] dark:bg-[#090c0a]"
          : "w-full min-h-[360px] sm:min-h-[440px] bg-transparent"
      } flex flex-col items-center justify-center text-zinc-900 dark:text-zinc-100 transition-colors duration-200 antialiased relative select-none ${className}`}
      {...props}
    >
      {/* Background ambient lighting */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_600px_at_50%_50%,rgba(16,185,129,0.08),transparent_75%)] dark:bg-[radial-gradient(circle_700px_at_50%_50%,rgba(16,185,129,0.07),transparent_80%)]"
        aria-hidden="true"
      />

      {/* Centerpiece: Logo with subtle breathing animation */}
      <div className="flex flex-col items-center">
        <div className="animate-divido-breathe flex items-center justify-center p-3">
          <img
            src="/webp/logo-fulls.webp"
            alt="Divido"
            className="h-11 sm:h-12 w-auto light-only dark:hidden drop-shadow-xs"
          />
          <img
            src="/webp/logo-fulls-dark.webp"
            alt="Divido"
            className="h-11 sm:h-12 w-auto dark-only hidden dark:block drop-shadow-sm"
          />
        </div>

        {/* Sleek emerald progress beam */}
        <div
          className="w-40 sm:w-44 h-[2px] bg-zinc-200/70 dark:bg-white/[0.08] rounded-full overflow-hidden relative mt-4"
          aria-hidden="true"
        >
          <div className="absolute inset-y-0 w-2/3 bg-gradient-to-r from-transparent via-emerald-500 to-transparent rounded-full animate-divido-shimmer" />
        </div>

        {/* Mindful status message */}
        {message && (
          <p className="mt-4 text-xs font-medium text-zinc-400 dark:text-zinc-500 tracking-wide text-center">
            {message}
          </p>
        )}
      </div>

      {/* Subtle bottom tagline */}
      {fullscreen && (
        <div className="absolute bottom-8 inset-x-0 text-center">
          <span className="text-[11px] font-medium text-zinc-400/80 dark:text-zinc-600/80 tracking-widest uppercase">
            A little awareness · A little more possibility
          </span>
        </div>
      )}
    </div>
  );
}

export default DividoLoadingScreen;

