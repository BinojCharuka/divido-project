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
  href: string;
  label: string;
  icon: LucideIcon;
  prefixes: string[];
}

const LEFT_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid, prefixes: ["/dashboard"] },
  { href: "/transactions", label: "History", icon: ArrowLeftRight, prefixes: ["/transactions"] },
];

const RIGHT_ITEMS: NavItem[] = [
  { href: "/budget", label: "Budget", icon: Wallet, prefixes: ["/budget"] },
  { href: "/insights", label: "Insights", icon: ChartNoAxesCombined, prefixes: ["/insights"] },
];

function isItemActive(item: NavItem, pathname: string, tappedHref: string | null): boolean {
  if (tappedHref) return tappedHref === item.href;
  return item.prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Premium Raised Floating Mobile Navigation Bar.
 * - Symmetrical floating pill container with liquid glass blur & hairline border.
 * - Active tab elevated above the bar inside a glowing circular bubble with mint/emerald aura.
 * - Central Add (+) button elevated in the exact dead center with emerald gradient & white plus.
 * - Clean vertical alignment and baseline consistency across all screen widths.
 */
export function MobileDock({ onAdd }: { onAdd: () => void }) {
  const pathname = usePathname();
  const isClient = useIsClient();
  const [tappedHref, setTappedHref] = useState<string | null>(null);

  useEffect(() => {
    setTappedHref(null);
  }, [pathname]);

  if (!isClient) return null;

  const renderItem = (item: NavItem) => {
    const active = isItemActive(item, pathname, tappedHref);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`floating-dock-link ${active ? "active is-active" : ""}`}
        aria-current={active ? "page" : undefined}
        onClick={() => setTappedHref(item.href)}
      >
        <div className="floating-dock-item">
          <div className={`floating-dock-icon-wrap ${active ? "is-raised" : ""}`}>
            <Icon
              size={active ? 22 : 20}
              strokeWidth={active ? 2.4 : 1.9}
              className="floating-dock-icon"
              aria-hidden="true"
            />
          </div>
          <span className="floating-dock-label">{item.label}</span>
        </div>
      </Link>
    );
  };

  return createPortal(
    <nav className="mobile-bottom-nav floating-dock-bar" aria-label="Mobile navigation">
      {/* Left Wing: Overview & History */}
      <div className="floating-dock-wing left">
        {LEFT_ITEMS.map(renderItem)}
      </div>

      {/* Central Elevated Add (+) Button */}
      <div className="floating-dock-center">
        <button
          type="button"
          className="mobile-add floating-dock-add"
          aria-label="Add transaction"
          onClick={onAdd}
        >
          <Plus size={24} strokeWidth={2.8} className="floating-dock-add-icon" aria-hidden="true" />
        </button>
      </div>

      {/* Right Wing: Budget & Insights */}
      <div className="floating-dock-wing right">
        {RIGHT_ITEMS.map(renderItem)}
      </div>
    </nav>,
    document.body,
  );
}
