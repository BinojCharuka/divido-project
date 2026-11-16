"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActive, type NavItem } from "./navigation";

/** A sidebar entry; marks itself as the current page. */
export function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const active = isActive(item, usePathname());
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`nav-item ${active ? "active" : ""}`}
      aria-current={active ? "page" : undefined}
      title={collapsed ? item.label : undefined}
    >
      <Icon size={19} strokeWidth={1.7} aria-hidden="true" />
      <span>{item.label}</span>
      {active && <span className="active-dot" aria-hidden="true" />}
    </Link>
  );
}
