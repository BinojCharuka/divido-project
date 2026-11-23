"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, LogOut, Target } from "lucide-react";
import { Brand } from "@/components/ui/Brand";
import { NavLink } from "./NavLink";
import { PRIMARY_NAV, SECONDARY_NAV } from "./navigation";

/** Desktop navigation. Collapses to an icon rail; expands on hover; hidden on mobile screens. */
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
  const pathname = usePathname();
  const isSettingsActive = pathname.startsWith("/settings");

  // Hover expand / contract state
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 120);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const handleNavClick = () => {
    setIsHovered(false);
    onNavigate?.();
  };

  // When pinned collapsed, hovering over the sidebar expands it.
  const isExpanded = !collapsed || isHovered;
  const isRail = !isExpanded;

  return (
    <aside
      className={`sidebar ${isHovered && collapsed ? "sidebar-hover-expanded" : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="sidebar-header-row mb-6">
        <Link href="/dashboard" className="sidebar-brand" aria-label="Divido dashboard" onClick={handleNavClick}>
          <Brand variant={isRail ? "icon" : "full"} />
        </Link>
        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Minimize sidebar"}
          title={collapsed ? "Expand sidebar" : "Minimize sidebar"}
        >
          {isRail ? <ChevronRight size={15} aria-hidden="true" /> : <ChevronLeft size={15} aria-hidden="true" />}
        </button>
      </div>

      <nav className="desktop-nav flex flex-col gap-1" aria-label="Main navigation">
        {!isRail && (
          <div className="workspace-label text-[11px] font-bold tracking-[0.14em] text-zinc-400 uppercase px-3.5 py-2">
            WORKSPACE
          </div>
        )}
        {PRIMARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} collapsed={isRail} onNavigate={handleNavClick} />
        ))}
        {!isRail && (
          <div className="workspace-label text-[11px] font-bold tracking-[0.14em] text-zinc-400 uppercase px-3.5 pt-5 pb-2">
            ACCOUNT
          </div>
        )}
        {SECONDARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} collapsed={isRail} onNavigate={handleNavClick} />
        ))}
      </nav>

      <div className="sidebar-bottom mt-auto pt-4 pb-4 flex flex-col gap-2">
        {!isRail && (
          <div className="sidebar-promo-card rounded-2xl bg-[#201d14] border border-[#ca8a04]/25 p-3.5 text-left shadow-sm">
            <div className="w-7 h-7 rounded-lg bg-[#ca8a04]/20 text-[#facc15] flex items-center justify-center mb-2">
              <Target size={15} strokeWidth={2.4} />
            </div>
            <div className="text-xs font-bold text-white tracking-tight">Build better habits</div>
            <div className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
              Track each rupee and make your goals feel closer.
            </div>
          </div>
        )}

        {/* Profile Card / Link - Visible in both collapsed rail & expanded */}
        <div
          className={`sidebar-user flex items-center ${
            isRail
              ? "justify-center p-0"
              : "p-2 rounded-xl bg-[#0c150f] border border-white/[0.08] hover:border-emerald-500/30 transition-colors"
          }`}
        >
          <Link
            href="/settings"
            className={`sidebar-profile-badge group relative flex items-center ${
              isRail
                ? "justify-center w-10 h-10 rounded-xl hover:bg-white/[0.06] transition-colors"
                : "gap-2.5 flex-1 min-w-0"
            }`}
            aria-label={`Profile and settings for ${userName || "user"}`}
            title={`${userName || "User profile"} · Settings`}
            onClick={handleNavClick}
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#142319] border border-emerald-500/40 text-emerald-300 font-bold text-xs tracking-wide shrink-0">
              {initials}
            </span>
            {!isRail && (
              <div className="flex-1 min-w-0 text-left">
                <strong className="block text-xs font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">
                  {userName || "Divido user"}
                </strong>
                <span className="block text-[10px] text-zinc-400 font-medium">
                  Personal account
                </span>
              </div>
            )}
            {isSettingsActive && isRail && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-[#07100b]" />
            )}
          </Link>
        </div>

        {/* Dedicated Sign Out Button */}
        <button
          type="button"
          onClick={onSignOut}
          className={`sidebar-signout-btn flex items-center transition-all cursor-pointer ${
            isRail
              ? "justify-center w-10 h-10 mx-auto rounded-xl text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20"
              : "gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-left"
          }`}
          aria-label="Sign out"
          title="Sign out of Divido"
        >
          <LogOut size={15} className="shrink-0" />
          {!isRail && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
