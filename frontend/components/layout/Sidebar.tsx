"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, MoreHorizontal, Target } from "lucide-react";
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
  onHelp: _onHelp,
  onSignOut,
  onNavigate,
}: {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  userName: string;
  initials: string;
  onHelp: () => void;
  onSignOut: () => void;
  onNavigate?: () => void;
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header-row mb-6">
        <Link href="/dashboard" className="sidebar-brand" aria-label="Divido dashboard" onClick={onNavigate}>
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
      <nav className="desktop-nav flex flex-col gap-1" aria-label="Main navigation">
        {!collapsed && <div className="workspace-label text-[11px] font-bold tracking-[0.14em] text-zinc-400 uppercase px-3.5 py-2">WORKSPACE</div>}
        {PRIMARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
        {!collapsed && <div className="workspace-label text-[11px] font-bold tracking-[0.14em] text-zinc-400 uppercase px-3.5 pt-5 pb-2">ACCOUNT</div>}
        {SECONDARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ))}
      </nav>
      <div className="sidebar-bottom mt-auto pt-6 flex flex-col gap-3">
        {!collapsed && (
          <div className="sidebar-promo-card rounded-2xl bg-[#201d14] border border-[#ca8a04]/25 p-4 text-left shadow-md">
            <div className="w-8 h-8 rounded-xl bg-[#ca8a04]/20 text-[#facc15] flex items-center justify-center mb-2.5">
              <Target size={17} strokeWidth={2.4} />
            </div>
            <div className="text-xs font-bold text-white tracking-tight">Build better habits</div>
            <div className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              Track each rupee and make your goals feel closer.
            </div>
          </div>
        )}

        <div className="sidebar-user flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.03] transition-colors">
          <span className="avatar w-9 h-9 rounded-full bg-[#7bc8a4] text-[#07100b] font-bold flex items-center justify-center text-xs shrink-0" aria-hidden="true">
            {initials}
          </span>
          {!collapsed && (
            <Link href="/settings" className="flex-1 min-w-0 text-left" onClick={onNavigate}>
              <strong className="block text-xs font-semibold text-white truncate">{userName || "Divido user"}</strong>
              <span className="block text-[11px] text-zinc-400">Personal account</span>
            </Link>
          )}
          <IconButton icon={MoreHorizontal} label="Sign out" onClick={onSignOut} className="text-zinc-400 hover:text-white" />
        </div>
      </div>
    </aside>
  );
}
