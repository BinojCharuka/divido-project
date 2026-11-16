"use client";

import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight, CircleHelp, LogOut } from "lucide-react";
import { Brand } from "@/components/ui/Brand";
import { IconButton } from "@/components/ui/IconButton";
import { NavLink } from "./NavLink";
import { PRIMARY_NAV, SECONDARY_NAV } from "./navigation";

/** Desktop navigation. Collapses to an icon rail; hidden on small screens (MobileDock instead). */
export function Sidebar({
  collapsed,
  onToggleCollapsed,
  userName,
  initials,
  onHelp,
  onSignOut,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  userName: string;
  initials: string;
  onHelp: () => void;
  onSignOut: () => void;
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header-row">
        <Link href="/dashboard" className="sidebar-brand" aria-label="Divido dashboard">
          <Brand variant={collapsed ? "icon" : "full"} />
        </Link>
        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Minimize sidebar"}
          title={collapsed ? "Expand sidebar" : "Minimize sidebar"}
        >
          {collapsed ? <ChevronRight size={15} aria-hidden="true" /> : <ChevronLeft size={15} aria-hidden="true" />}
        </button>
      </div>
      <div className="workspace-label">Personal space</div>
      <nav className="desktop-nav" aria-label="Main navigation">
        {PRIMARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} collapsed={collapsed} />
        ))}
        <div className="nav-divider" />
        {SECONDARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} collapsed={collapsed} />
        ))}
      </nav>
      <div className="sidebar-bottom">
        <button type="button" className="help-link" onClick={onHelp} title={collapsed ? "How Divido works" : undefined}>
          <CircleHelp size={17} aria-hidden="true" />
          <span>How Divido works</span>
          <ArrowUpRight size={14} aria-hidden="true" />
        </button>
        <div className="sidebar-user">
          <span className="avatar" aria-hidden="true">
            {initials}
          </span>
          <Link href="/settings">
            <strong>{userName}</strong>
            <span>Personal account</span>
          </Link>
          <IconButton icon={LogOut} label="Sign out" onClick={onSignOut} />
        </div>
      </div>
    </aside>
  );
}
