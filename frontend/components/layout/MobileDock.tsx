"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeftRight,
  ChartNoAxesCombined,
  LayoutGrid,
  Plus,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useIsClient } from "@/lib/useIsClient";

interface NavItem {
  slot: 0 | 1 | 3 | 4;
  href: string;
  label: string;
  icon: LucideIcon;
  prefixes: string[];
}

const NAV_ITEMS: NavItem[] = [
  { slot: 0, href: "/dashboard", label: "Overview", icon: LayoutGrid, prefixes: ["/dashboard"] },
  { slot: 1, href: "/transactions", label: "History", icon: ArrowLeftRight, prefixes: ["/transactions"] },
  // Slot 2 is Central Add (+)
  { slot: 3, href: "/budget", label: "Budget", icon: Wallet, prefixes: ["/budget"] },
  { slot: 4, href: "/insights", label: "Insights", icon: ChartNoAxesCombined, prefixes: ["/insights"] },
];

/** SVG top contour paths for each active slot in a 380x72 viewBox */
const DOCK_PATHS: Record<0 | 1 | 3 | 4, { fill: string; rim: string }> = {
  0: {
    fill:
      "M 0 46 " +
      "C 0 24, 14 16, 22 9 " +
      "C 27 5, 32 1, 38 1 " +
      "C 44 1, 49 5, 54 9 " +
      "C 62 16, 66 16, 76 16 " +
      "L 162 16 " +
      "C 174 16, 176 34, 190 34 " +
      "C 204 34, 206 16, 218 16 " +
      "L 354 16 " +
      "C 368 16, 380 26, 380 46 " +
      "L 380 48 " +
      "C 380 62, 368 72, 354 72 " +
      "L 26 72 " +
      "C 12 72, 0 62, 0 48 Z",
    rim:
      "M 0 46 " +
      "C 0 24, 14 16, 22 9 " +
      "C 27 5, 32 1, 38 1 " +
      "C 44 1, 49 5, 54 9 " +
      "C 62 16, 66 16, 76 16 " +
      "L 162 16 " +
      "C 174 16, 176 34, 190 34 " +
      "C 204 34, 206 16, 218 16 " +
      "L 354 16 " +
      "C 368 16, 380 26, 380 46",
  },
  1: {
    fill:
      "M 0 46 " +
      "C 0 26, 12 16, 26 16 " +
      "L 86 16 " +
      "C 98 16, 102 1, 114 1 " +
      "C 126 1, 130 16, 142 16 " +
      "L 162 16 " +
      "C 174 16, 176 34, 190 34 " +
      "C 204 34, 206 16, 218 16 " +
      "L 354 16 " +
      "C 368 16, 380 26, 380 46 " +
      "L 380 48 " +
      "C 380 62, 368 72, 354 72 " +
      "L 26 72 " +
      "C 12 72, 0 62, 0 48 Z",
    rim:
      "M 0 46 " +
      "C 0 26, 12 16, 26 16 " +
      "L 86 16 " +
      "C 98 16, 102 1, 114 1 " +
      "C 126 1, 130 16, 142 16 " +
      "L 162 16 " +
      "C 174 16, 176 34, 190 34 " +
      "C 204 34, 206 16, 218 16 " +
      "L 354 16 " +
      "C 368 16, 380 26, 380 46",
  },
  3: {
    fill:
      "M 0 46 " +
      "C 0 26, 12 16, 26 16 " +
      "L 162 16 " +
      "C 174 16, 176 34, 190 34 " +
      "C 204 34, 206 16, 218 16 " +
      "L 238 16 " +
      "C 250 16, 254 1, 266 1 " +
      "C 278 1, 282 16, 294 16 " +
      "L 354 16 " +
      "C 368 16, 380 26, 380 46 " +
      "L 380 48 " +
      "C 380 62, 368 72, 354 72 " +
      "L 26 72 " +
      "C 12 72, 0 62, 0 48 Z",
    rim:
      "M 0 46 " +
      "C 0 26, 12 16, 26 16 " +
      "L 162 16 " +
      "C 174 16, 176 34, 190 34 " +
      "C 204 34, 206 16, 218 16 " +
      "L 238 16 " +
      "C 250 16, 254 1, 266 1 " +
      "C 278 1, 282 16, 294 16 " +
      "L 354 16 " +
      "C 368 16, 380 26, 380 46",
  },
  4: {
    fill:
      "M 0 46 " +
      "C 0 26, 12 16, 26 16 " +
      "L 162 16 " +
      "C 174 16, 176 34, 190 34 " +
      "C 204 34, 206 16, 218 16 " +
      "L 304 16 " +
      "C 314 16, 318 16, 326 9 " +
      "C 331 5, 336 1, 342 1 " +
      "C 348 1, 353 5, 358 9 " +
      "C 366 16, 380 24, 380 46 " +
      "L 380 48 " +
      "C 380 62, 368 72, 354 72 " +
      "L 26 72 " +
      "C 12 72, 0 62, 0 48 Z",
    rim:
      "M 0 46 " +
      "C 0 26, 12 16, 26 16 " +
      "L 162 16 " +
      "C 174 16, 176 34, 190 34 " +
      "C 204 34, 206 16, 218 16 " +
      "L 304 16 " +
      "C 314 16, 318 16, 326 9 " +
      "C 331 5, 336 1, 342 1 " +
      "C 348 1, 353 5, 358 9 " +
      "C 366 16, 380 24, 380 46",
  },
};

const SLOT_PERCENTAGES: Record<0 | 1 | 3 | 4, number> = {
  0: 10,
  1: 30,
  3: 70,
  4: 90,
};

function determineActiveSlot(pathname: string, tappedHref: string | null): 0 | 1 | 3 | 4 {
  const current = tappedHref || pathname;
  if (current.startsWith("/transactions")) return 1;
  if (current.startsWith("/budget")) return 3;
  if (current.startsWith("/insights")) return 4;
  return 0; // default Overview
}

/**
 * Premium Raised Floating Navigation Bar inspired by custom curved mobile dock design.
 * Features:
 * - Raised glowing circular active bubble that glides to the active tab.
 * - Smooth contour wave on the upper boundary forming a crest around active circle.
 * - Central Add (+) button elevated above a smooth scooped notch at 50%.
 * - Active label displayed cleanly below the raised icon in Divido mint green.
 * - Inactive icons and labels resting inside the navigation bar.
 */
export function MobileDock({ onAdd }: { onAdd: () => void }) {
  const pathname = usePathname();
  const isClient = useIsClient();
  const [tappedHref, setTappedHref] = useState<string | null>(null);

  useEffect(() => {
    setTappedHref(null);
  }, [pathname]);

  if (!isClient) return null;

  const activeSlot = determineActiveSlot(pathname, tappedHref);
  const activeItem = NAV_ITEMS.find((item) => item.slot === activeSlot) ?? NAV_ITEMS[0];
  const ActiveIcon = activeItem.icon;
  const activePercent = SLOT_PERCENTAGES[activeSlot];
  const currentShape = DOCK_PATHS[activeSlot];

  return createPortal(
    <nav className="mobile-bottom-nav raised-floating-nav" aria-label="Mobile navigation">
      {/* Dynamic SVG background contour with active hill and center scoop */}
      <svg
        className="raised-dock-svg"
        viewBox="0 0 380 72"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path className="raised-dock-fill" d={currentShape.fill} />
        <path className="raised-dock-rim" d={currentShape.rim} />
      </svg>

      {/* Floating Active Circular Bubble */}
      <div
        className="raised-active-bubble"
        style={{ left: `${activePercent}%` }}
        aria-hidden="true"
      >
        <ActiveIcon size={24} strokeWidth={2.4} className="raised-active-bubble-icon" />
      </div>

      {/* 5 Column interactive slots */}
      <div className="raised-dock-slots">
        {/* Slot 0: Overview */}
        {renderNavItem(NAV_ITEMS[0], activeSlot, setTappedHref)}

        {/* Slot 1: History */}
        {renderNavItem(NAV_ITEMS[1], activeSlot, setTappedHref)}

        {/* Slot 2: Central Add (+) */}
        <div className="raised-slot raised-slot-center">
          <button
            type="button"
            className="mobile-add raised-add-btn"
            aria-label="Add transaction"
            onClick={onAdd}
          >
            <Plus size={26} strokeWidth={2.8} className="raised-add-icon" aria-hidden="true" />
          </button>
        </div>

        {/* Slot 3: Budget */}
        {renderNavItem(NAV_ITEMS[2], activeSlot, setTappedHref)}

        {/* Slot 4: Insights */}
        {renderNavItem(NAV_ITEMS[3], activeSlot, setTappedHref)}
      </div>
    </nav>,
    document.body,
  );
}

function renderNavItem(
  item: NavItem,
  activeSlot: 0 | 1 | 3 | 4,
  setTappedHref: (href: string) => void,
) {
  const isActive = item.slot === activeSlot;
  const Icon = item.icon;

  return (
    <div key={item.href} className="raised-slot">
      <Link
        href={item.href}
        className={`raised-nav-link ${isActive ? "active is-active" : ""}`}
        aria-current={isActive ? "page" : undefined}
        onClick={() => setTappedHref(item.href)}
      >
        {/* Inactive icon stays in bar; when active, the raised bubble hovers above */}
        <div className={`raised-slot-content ${isActive ? "is-elevated" : ""}`}>
          <Icon size={20} strokeWidth={2} className="raised-inactive-icon" aria-hidden="true" />
          <span className="raised-slot-label">{item.label}</span>
        </div>
      </Link>
    </div>
  );
}
