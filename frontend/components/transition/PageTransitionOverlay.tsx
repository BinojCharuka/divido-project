"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getRouteMetadata } from "./routeTitles";

interface PageTransitionOverlayProps {
  isOpen: boolean;
  phase: "hidden" | "preparing" | "swiping";
  targetRoute: string;
}

/**
 * Minimalist, luxury curtain overlay for Divido page transitions.
 * Zero percentage counters, zero numerical loaders, zero progress bars.
 * Keeps the viewport deep black while the destination page prepares in the background,
 * then smoothly fades away as the new page executes its upward swipe reveal.
 */
export function PageTransitionOverlay({
  isOpen,
  phase,
  targetRoute,
}: PageTransitionOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen || phase === "hidden") {
    return null;
  }

  const metadata = getRouteMetadata(targetRoute);

  return createPortal(
    <div
      className={`page-transition-curtain ${phase === "swiping" ? "is-swiping-out" : "is-preparing"}`}
      aria-hidden={!isOpen}
      role="status"
      aria-live="polite"
      aria-label={`Opening ${metadata.title}`}
    >
      <div className="curtain-ambient-glow" />

      {/* Minimalist Center Mark */}
      <div className="curtain-center">
        <div className="curtain-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/webp/logo-fulls-dark.webp"
            alt="Divido"
            className="curtain-brand-logo"
            width={124}
            height={32}
          />
        </div>
        <div className="curtain-pulse-bar">
          <span className="curtain-pulse-dot" />
        </div>
      </div>
    </div>,
    document.body,
  );
}
