"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight, MoreHorizontal, Target } from "lucide-react";
import { Brand } from "@/components/ui/Brand";
import { IconButton } from "@/components/ui/IconButton";
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

      <div className="sidebar-bottom mt-auto pt-6 flex flex-col gap-3">
        {!isRail && (
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

        {/* Profile Button - Highlighted in both collapsed rail & expanded states */}
        <div
          className={`sidebar-user flex items-center ${
            isRail
              ? "justify-center p-1"
              : "gap-3 p-2.5 rounded-2xl bg-emerald-500/[0.07] border border-emerald-500/25 hover:border-emerald-500/40 hover:bg-emerald-500/12"
          } transition-all duration-200`}
        >
          <Link
            href="/settings"
            className={`sidebar-profile-badge group relative flex items-center ${
              isRail
                ? "justify-center w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/35 hover:border-emerald-400 hover:bg-emerald-500/20 hover:shadow-[0_0_16px_rgba(52,211,153,0.35)]"
                : "gap-3 flex-1 min-w-0"
            } transition-all duration-200`}
            aria-label={`Profile and settings for ${userName || "user"}`}
            title={`${userName || "User profile"} · Settings`}
            onClick={handleNavClick}
          >
            <span className="avatar-highlight flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-[#34d399] via-[#10b981] to-[#059669] text-[#041c10] font-black text-xs tracking-wider shadow-[0_0_12px_rgba(52,211,153,0.35)] ring-2 ring-emerald-400/60 shrink-0 group-hover:scale-105 transition-transform">
              {initials}
            </span>
            <div className={`flex-1 min-w-0 text-left ${isRail ? "hidden" : "block"}`}>
              <strong className="block text-xs font-bold text-white truncate group-hover:text-emerald-400 transition-colors">
                {userName || "Divido user"}
              </strong>
              <span className="block text-[11px] font-medium text-emerald-400/80">
                Personal account
              </span>
            </div>
            {isSettingsActive && isRail && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#07100b] shadow-[0_0_8px_#34d399]" />
            )}
          </Link>
          <IconButton
            icon={MoreHorizontal}
            label="Sign out"
            onClick={onSignOut}
            className={`text-zinc-400 hover:text-white hover:bg-white/[0.08] ${isRail ? "icon-button-rail" : ""}`}
          />
        </div>
      </div>
    </aside>
  );
}
