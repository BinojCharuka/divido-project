"use client";

import { DividoLoadingScreen } from "@/components/ui/DividoLoadingScreen";

export interface LoadingPanelProps {
  label?: string;
  fullscreen?: boolean;
}

/**
 * Mindful, high-craft Divido loading panel.
 * Replaces wireframe skeletons with the official Divido branded loading presentation,
 * featuring the breathing brand mark, emerald shimmer beam, and mindful status text.
 */
export function LoadingPanel({ label = "Loading…", fullscreen = false }: LoadingPanelProps) {
  return (
    <div
      className="panel app-loading w-full flex flex-col items-center justify-center p-0 overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0c120e]/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="status"
      aria-live="polite"
      data-loading="true"
    >
      <DividoLoadingScreen
        message={label}
        fullscreen={fullscreen}
        role={undefined}
        className="w-full min-h-[360px] sm:min-h-[440px]"
      />
    </div>
  );
}
