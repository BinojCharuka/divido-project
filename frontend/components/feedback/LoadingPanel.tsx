"use client";

import { Loader2 } from "lucide-react";

/**
 * High-craft dark skeleton loading panel for Divido.
 * Displays theme-matched skeleton placeholders with an animated emerald pulse,
 * preventing blank screens during data fetching.
 */
export function LoadingPanel({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="panel app-loading w-full flex flex-col gap-4 py-2 animate-in fade-in duration-150"
      role="status"
      aria-live="polite"
      data-loading="true"
    >
      {/* Discreet loading status indicator */}
      <div className="flex items-center gap-2 self-start px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[#34d399] text-xs font-medium">
        <Loader2 size={13} className="animate-spin text-[#34d399]" />
        <span>{label}</span>
      </div>

      {/* Header skeleton: Greeting / Month Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-2">
          <div className="w-28 h-3.5 rounded-md bg-white/[0.06] animate-pulse" />
          <div className="w-48 sm:w-64 h-8 rounded-xl bg-white/[0.08] animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-32 h-9 rounded-xl bg-white/[0.05] animate-pulse" />
          <div className="hidden sm:block w-24 h-9 rounded-xl bg-white/[0.05] animate-pulse" />
        </div>
      </div>

      {/* Metric Cards Skeleton Grid (3 summary cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="p-4 rounded-2xl bg-[#111914] border border-white/[0.08] flex flex-col gap-3 relative overflow-hidden"
          >
            {/* Shimmer sweep effect */}
            <div className="absolute inset-0 -translate-x-full animate-divido-shimmer bg-gradient-to-r from-transparent via-white/[0.04] to-transparent pointer-events-none" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/[0.07] animate-pulse" />
                <div className="w-20 h-3.5 rounded-md bg-white/[0.06] animate-pulse" />
              </div>
              <div className="w-4 h-4 rounded-full bg-white/[0.04] animate-pulse" />
            </div>

            <div className="w-32 h-6 rounded-lg bg-white/[0.09] animate-pulse mt-0.5" />
            <div className="w-24 h-3 rounded-md bg-white/[0.04] animate-pulse" />
          </div>
        ))}
      </div>

      {/* Breakdown Card Skeleton */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#111914] border border-white/[0.08] flex flex-col gap-3.5 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="w-36 h-4 rounded-md bg-white/[0.08] animate-pulse" />
          <div className="w-24 h-3.5 rounded-md bg-white/[0.05] animate-pulse" />
        </div>

        {/* 3 progress bar row skeletons */}
        <div className="flex flex-col gap-3 mt-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg bg-white/[0.06] animate-pulse" />
                  <div className="w-20 h-3.5 rounded-md bg-white/[0.06] animate-pulse" />
                </div>
                <div className="w-16 h-3.5 rounded-md bg-white/[0.07] animate-pulse" />
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                <div
                  className="h-full bg-emerald-500/25 rounded-full animate-pulse"
                  style={{ width: `${i === 1 ? 60 : i === 2 ? 35 : 20}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <span className="sr-only">{label}</span>
    </div>
  );
}
