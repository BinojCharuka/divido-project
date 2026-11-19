"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useIsClient } from "@/lib/useIsClient";
import { createPortal } from "react-dom";
import { Plus } from "lucide-react";
import { BUDGET, DASHBOARD, INSIGHTS, isActive, TRANSACTIONS, type NavItem } from "./navigation";

const LEFT: NavItem[] = [
  { ...DASHBOARD, label: "Overview" },
  { ...TRANSACTIONS, label: "History" },
];
const RIGHT: NavItem[] = [BUDGET, INSIGHTS];

/**
 * Floating bottom navigation for small screens. Rendered into <body> so transformed
 * ancestors (page transitions) cannot offset its fixed position.
 */
export function MobileDock({ onAdd }: { onAdd: () => void }) {
  const pathname = usePathname();
  const isClient = useIsClient();
  if (!isClient) return null;

  const link = (item: NavItem) => {
    const active = isActive(item, pathname);
    const Icon = item.icon;
    return (
      <Link key={item.href} href={item.href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
        <Icon size={19} aria-hidden="true" />
        <span>{item.label}</span>
      </Link>
    );
  };

  return createPortal(
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      {LEFT.map(link)}
      <button type="button" className="mobile-add" aria-label="Add transaction" onClick={onAdd}>
        <Plus size={23} aria-hidden="true" />
      </button>
      {RIGHT.map(link)}
    </nav>,
    document.body,
  );
}
