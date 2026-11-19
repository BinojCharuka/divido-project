"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeftRight, ChartNoAxesCombined, LayoutGrid, Plus, Wallet, type LucideIcon } from "lucide-react";
import { useIsClient } from "@/lib/useIsClient";
import { isActive } from "./navigation";

interface DockItem {
  href: string;
  label: string;
  icon: LucideIcon;
  prefixes: string[];
}

const LEFT_ITEMS: DockItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid, prefixes: ["/dashboard"] },
  { href: "/transactions", label: "History", icon: ArrowLeftRight, prefixes: ["/transactions"] },
];

const RIGHT_ITEMS: DockItem[] = [
  { href: "/budget", label: "Budget", icon: Wallet, prefixes: ["/budget"] },
  { href: "/insights", label: "Insights", icon: ChartNoAxesCombined, prefixes: ["/insights"] },
];

/**
 * Floating Liquid Glass Mobile Bottom Navigation with Perfectly Balanced Symmetric Wings.
 * Rendered into <body> via React Portal so transformed ancestors cannot offset its fixed position.
 */
export function MobileDock({ onAdd }: { onAdd: () => void }) {
  const pathname = usePathname();
  const isClient = useIsClient();
  const [tappedHref, setTappedHref] = useState<string | null>(null);

  // Sync tapped state when pathname changes
  useEffect(() => {
    setTappedHref(null);
  }, [pathname]);

  if (!isClient) return null;

  const renderItem = (item: DockItem) => {
    const active = tappedHref ? tappedHref === item.href : isActive(item, pathname);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`mobile-nav-link ${active ? "active is-active" : ""}`}
        aria-current={active ? "page" : undefined}
        onClick={() => setTappedHref(item.href)}
      >
        <div className="mobile-nav-pill">
          <Icon size={20} strokeWidth={active ? 2.3 : 1.9} className="mobile-nav-icon" aria-hidden="true" />
          <span className="mobile-nav-label">{item.label}</span>
        </div>
      </Link>
    );
  };

  return createPortal(
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      <div className="mobile-dock-wing left">
        {LEFT_ITEMS.map(renderItem)}
      </div>
      <button
        type="button"
        className="mobile-add"
        aria-label="Add transaction"
        onClick={onAdd}
      >
        <Plus size={24} strokeWidth={2.6} className="mobile-add-icon" aria-hidden="true" />
      </button>
      <div className="mobile-dock-wing right">
        {RIGHT_ITEMS.map(renderItem)}
      </div>
    </nav>,
    document.body,
  );
}
