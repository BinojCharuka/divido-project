"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getRouteMetadata } from "./routeTitles";

interface PageTransitionOverlayProps {
  isOpen: boolean;
  phase: "hidden" | "active" | "revealing";
  targetRoute: string;
  progress: number;
}

export function PageTransitionOverlay({
  isOpen,
  phase,
  targetRoute,
  progress,
}: PageTransitionOverlayProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen || phase === "hidden") {
    return null;
  }

  const metadata = getRouteMetadata(targetRoute);

  // Progressive reveal values for the destination title
  // Begins fading and sliding up once counter crosses 20%
  const titleProgress = Math.max(0, Math.min(1, (progress - 20) / 45));
  const titleOpacity = titleProgress;
  const titleTranslateY = Math.round(20 * (1 - titleProgress));

  return createPortal(
    <div
      className={`page-transition-overlay ${phase === "revealing" ? "is-revealing" : "is-active"}`}
      aria-hidden={!isOpen}
      role="status"
      aria-live="polite"
      aria-label={`Navigating to ${metadata.title}`}
    >
      <div className="transition-ambient-glow" />

      {/* Top Header Watermark */}
      <header className="transition-header">
        <div className="transition-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/webp/logo-fulls-dark.webp"
            alt="Divido"
            className="transition-brand-logo"
            width={120}
            height={32}
          />
        </div>
        <div className="transition-system-pill">
          <span className="transition-live-dot" />
          <span>Divido System</span>
        </div>
      </header>

      {/* Central Interactive Content */}
      <div className="transition-center">
        {/* Large Cinematic Percentage Counter */}
        <div className="transition-counter-wrapper">
          <div className="transition-counter" aria-hidden="true">
            <span className="transition-counter-number">{progress}</span>
            <span className="transition-counter-percent">%</span>
          </div>

          {/* Thin Glowing Progress Bar */}
          <div className="transition-progress-track">
            <div
              className="transition-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Dynamic Destination Title Reveal */}
        <div
          className="transition-destination"
          style={{
            opacity: titleOpacity,
            transform: `translate3d(0, ${titleTranslateY}px, 0)`,
          }}
        >
          <div className="transition-eyebrow-row">
            <span className="transition-eyebrow">{metadata.eyebrow}</span>
          </div>
          <h2 className="transition-title">{metadata.title}</h2>
          <p className="transition-subtitle">{metadata.subtitle}</p>
        </div>
      </div>

      {/* Minimal Footer */}
      <footer className="transition-footer">
        <span>Personal budgeting workspace</span>
        <span>Divido Engine</span>
      </footer>
    </div>,
    document.body,
  );
}
