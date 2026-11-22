"use client";

import { useIsClient } from "@/lib/useIsClient";

/**
 * Animated Ambient Background.
 * Renders floating organic gradient orbs and delicate geometric wireframe shapes
 * (concentric arcs, squircle outlines, and gentle ambient shimmer)
 * reflecting Divido's signature calm, dark green financial identity.
 */
export function AnimatedBackground() {
  const isClient = useIsClient();
  if (!isClient) return null;

  return (
    <div
      className="ambient-shapes-container fixed inset-0 pointer-events-none overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* 1. Floating Organic Mesh Gradient Blobs */}
      <div className="ambient-blob ambient-blob-1" />
      <div className="ambient-blob ambient-blob-2" />
      <div className="ambient-blob ambient-blob-3" />

      {/* 2. Delicate Animated Geometric Wireframes */}
      <svg
        className="ambient-geo ambient-geo-arcs"
        viewBox="0 0 400 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="200" cy="200" r="180" stroke="currentColor" strokeWidth="1" strokeDasharray="4 8" />
        <circle cx="200" cy="200" r="130" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="200" cy="200" r="80" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 6" />
      </svg>

      <svg
        className="ambient-geo ambient-geo-squircle"
        viewBox="0 0 300 300"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="30"
          y="30"
          width="240"
          height="240"
          rx="54"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="6 8"
        />
        <rect
          x="65"
          y="65"
          width="170"
          height="170"
          rx="38"
          stroke="currentColor"
          strokeWidth="1.2"
        />
      </svg>

      <svg
        className="ambient-geo ambient-geo-diamond"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="100"
          y="20"
          width="110"
          height="110"
          rx="22"
          transform="rotate(45 100 20)"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>

      {/* 3. Subtle floating sparkles */}
      <div className="ambient-sparkle ambient-sparkle-1" />
      <div className="ambient-sparkle ambient-sparkle-2" />
      <div className="ambient-sparkle ambient-sparkle-3" />
    </div>
  );
}

