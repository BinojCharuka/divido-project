"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowDownLeft,
  BarChart3,
  BookOpen,
  Camera,
  CircleHelp,
  History,
  LayoutGrid,
  LogOut,
  Menu,
  Plus,
  Receipt,
  Settings,
  User,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { useIsClient } from "@/lib/useIsClient";
import type { TransactionType } from "@/types/transaction";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  prefixes: string[];
}

export interface MobileDockProps {
  onAdd: (type?: TransactionType) => void;
  onScan?: () => void;
  userName?: string;
  email?: string;
  initials?: string;
  onHelp?: () => void;
  onSignOut?: () => void;
}

const LEFT_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", icon: LayoutGrid, prefixes: ["/dashboard"] },
  { href: "/transactions", label: "History", icon: History, prefixes: ["/transactions"] },
];

const RIGHT_ITEMS: NavItem[] = [
  { href: "/budget", label: "Budget", icon: Wallet, prefixes: ["/budget"] },
];

function isItemActive(item: NavItem, pathname: string, tappedHref: string | null): boolean {
  if (tappedHref) return tappedHref === item.href;
  return item.prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Premium Raised Floating Mobile Navigation Bar with "More" Slide-over Drawer.
 * - Symmetrical floating pill container with liquid glass blur & hairline border.
 * - Active tab elevated above the bar inside a glowing circular bubble with mint/emerald aura.
 * - Central Add (+) button elevated in the exact dead center with emerald gradient & white plus.
 * - "More" button replaces "Insights" on the right wing and slides out a sleek mobile drawer
 *   housing Insights, Profile, Settings & Preferences, Reflection, and Logout (matching BOC Flex style).
 */
export function MobileDock({
  onAdd,
  onScan,
  userName = "Divido user",
  email = "",
  initials = "DU",
  onHelp,
  onSignOut,
}: MobileDockProps) {
  const pathname = usePathname();
  const isClient = useIsClient();
  const [tappedHref, setTappedHref] = useState<string | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [isAddClosing, setIsAddClosing] = useState(false);

  const closeDrawer = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setMoreOpen(false);
      setIsClosing(false);
    }, 280);
  }, []);

  const openDrawer = useCallback(() => {
    if (addMenuOpen) {
      setAddMenuOpen(false);
      setIsAddClosing(false);
    }
    setIsClosing(false);
    setMoreOpen(true);
  }, [addMenuOpen]);

  const closeAddMenu = useCallback(() => {
    setIsAddClosing(true);
    setTimeout(() => {
      setAddMenuOpen(false);
      setIsAddClosing(false);
    }, 220);
  }, []);

  const openAddMenu = useCallback(() => {
    if (moreOpen) closeDrawer();
    setIsAddClosing(false);
    setAddMenuOpen(true);
  }, [moreOpen, closeDrawer]);

  const toggleAddMenu = useCallback(() => {
    if (addMenuOpen) {
      closeAddMenu();
    } else {
      openAddMenu();
    }
  }, [addMenuOpen, closeAddMenu, openAddMenu]);

  // Close menus and reset tapped state on route change
  useEffect(() => {
    setTappedHref(null);
    setMoreOpen(false);
    setIsClosing(false);
    setAddMenuOpen(false);
    setIsAddClosing(false);
  }, [pathname]);

  // Handle escape key to close menus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (moreOpen) closeDrawer();
        if (addMenuOpen) closeAddMenu();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [moreOpen, addMenuOpen, closeDrawer, closeAddMenu]);

  if (!isClient) return null;

  const isMoreActive =
    moreOpen ||
    pathname.startsWith("/insights") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/reflection");

  const renderItem = (item: NavItem) => {
    const active = !moreOpen && isItemActive(item, pathname, tappedHref);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        className={`floating-dock-link ${active ? "active is-active" : ""}`}
        aria-current={active ? "page" : undefined}
        onClick={() => {
          setTappedHref(item.href);
          if (moreOpen) closeDrawer();
        }}
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
    <>
      {/* 1. Slide-over "More" Drawer Backdrop */}
      {moreOpen && (
        <div
          className={`more-drawer-backdrop ${isClosing ? "is-closing" : "is-open"}`}
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      {/* 2. Slide-over "More" Drawer Panel (BOC Flex mobile menu style) */}
      {moreOpen && (
        <div
          id="mobile-more-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="More navigation menu"
          className={`more-drawer-panel ${isClosing ? "is-closing" : "is-open"}`}
        >
          <div>
            {/* Header with User Info & Circular Avatar with Gold Ring */}
            <div className="more-drawer-header flex items-center justify-between pb-5 border-b border-white/[0.08] mb-2">
              <div className="flex flex-col text-left">
                <span className="text-base font-bold text-white tracking-tight leading-tight">
                  {userName}
                </span>
                <span className="text-xs text-zinc-400 mt-1 truncate max-w-[190px]">
                  {email || "Personal account • LKR"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-11 h-11 rounded-full bg-[#7bc8a4] text-[#07100b] font-bold flex items-center justify-center text-sm ring-2 ring-[#e2d274] shadow-xs shrink-0">
                  {initials}
                </div>
                <button
                  type="button"
                  onClick={closeDrawer}
                  aria-label="Close menu"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors ml-0.5 cursor-pointer"
                >
                  <X size={18} strokeWidth={2.2} />
                </button>
              </div>
            </div>

            {/* Menu Items List matching Image 2 (Text on left, Icon on right with dividers) */}
            <nav className="flex flex-col" aria-label="More menu navigation">
              {/* Insights */}
              <Link
                href="/insights"
                className="more-drawer-item group"
                onClick={closeDrawer}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white group-hover:text-[#34d399] transition-colors">
                    Insights & Analytics
                  </span>
                  <span className="text-[11px] text-zinc-400 mt-0.5">
                    Spending patterns and trends
                  </span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-[#13271c] border border-emerald-500/20 text-[#34d399] flex items-center justify-center shrink-0 shadow-xs">
                  <BarChart3 size={17} strokeWidth={2.2} />
                </div>
              </Link>

              {/* Profile */}
              <Link
                href="/settings"
                className="more-drawer-item group"
                onClick={closeDrawer}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white group-hover:text-[#34d399] transition-colors">
                    Profile Details
                  </span>
                  <span className="text-[11px] text-zinc-400 mt-0.5">
                    Display name & base currency
                  </span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-[#13271c] border border-emerald-500/20 text-[#34d399] flex items-center justify-center shrink-0 shadow-xs">
                  <User size={17} strokeWidth={2.2} />
                </div>
              </Link>

              {/* Settings */}
              <Link
                href="/settings"
                className="more-drawer-item group"
                onClick={closeDrawer}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white group-hover:text-[#34d399] transition-colors">
                    Settings & Preferences
                  </span>
                  <span className="text-[11px] text-zinc-400 mt-0.5">
                    Security, data export & account
                  </span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-[#2a2412] border border-amber-500/20 text-[#fcd34d] flex items-center justify-center shrink-0 shadow-xs">
                  <Settings size={17} strokeWidth={2.2} />
                </div>
              </Link>

              {/* Monthly Reflection */}
              <Link
                href="/reflection"
                className="more-drawer-item group"
                onClick={closeDrawer}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white group-hover:text-[#34d399] transition-colors">
                    Monthly Reflection
                  </span>
                  <span className="text-[11px] text-zinc-400 mt-0.5">
                    Review and record money habits
                  </span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-[#13271c] border border-emerald-500/20 text-[#34d399] flex items-center justify-center shrink-0 shadow-xs">
                  <BookOpen size={17} strokeWidth={2.2} />
                </div>
              </Link>

              {/* How Divido Works / FAQ */}
              <button
                type="button"
                className="more-drawer-item group"
                onClick={() => {
                  closeDrawer();
                  onHelp?.();
                }}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-white group-hover:text-[#34d399] transition-colors">
                    How Divido Works
                  </span>
                  <span className="text-[11px] text-zinc-400 mt-0.5">
                    Budgeting rules & user principles
                  </span>
                </div>
                <div className="w-9 h-9 rounded-xl bg-[#18201a] border border-white/[0.08] text-zinc-300 flex items-center justify-center shrink-0 shadow-xs">
                  <CircleHelp size={17} strokeWidth={2.2} />
                </div>
              </button>
            </nav>
          </div>

          {/* Bottom Logout Button matching Image 2 */}
          <div className="more-drawer-logout pt-4 border-t border-white/[0.08] mt-4">
            <button
              type="button"
              className="more-drawer-item group !border-none !py-2"
              onClick={() => {
                closeDrawer();
                onSignOut?.();
              }}
            >
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-rose-300 group-hover:text-rose-200 transition-colors">
                  Logout
                </span>
                <span className="text-[11px] text-zinc-500 mt-0.5">
                  End your active session
                </span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#2a1714] border border-rose-500/20 text-[#fbbf24] flex items-center justify-center shrink-0 shadow-xs">
                <LogOut size={18} strokeWidth={2.2} />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 3. Speed-Dial Action Menu Backdrop */}
      {addMenuOpen && (
        <div
          className={`dock-action-backdrop ${isAddClosing ? "is-closing" : ""}`}
          onClick={closeAddMenu}
          aria-hidden="true"
        />
      )}

      {/* 4. Speed-Dial Floating Actions (Add Income, Scan Receipt & Add Expense) */}
      {addMenuOpen && (
        <div
          className={`dock-action-popup ${isAddClosing ? "is-closing" : "is-open"}`}
          role="menu"
          aria-label="Add transaction actions"
        >
          {/* Action 1: Add Income (Left) */}
          <button
            type="button"
            role="menuitem"
            className="dock-action-item dock-item-left group"
            onClick={() => {
              closeAddMenu();
              onAdd("INCOME");
            }}
            aria-label="Add income"
          >
            <div className="dock-action-btn income-btn">
              <ArrowDownLeft size={28} strokeWidth={2.8} className="text-white drop-shadow-sm" aria-hidden="true" />
            </div>
            <span className="dock-action-label">Add income</span>
          </button>

          {/* Action 2: Scan Receipt (Middle / Center Hero) */}
          <button
            type="button"
            role="menuitem"
            className="dock-action-item dock-item-center group"
            onClick={() => {
              closeAddMenu();
              if (onScan) {
                onScan();
              } else {
                onAdd("EXPENSE");
              }
            }}
            aria-label="Scan receipt"
          >
            <div className="dock-action-btn scan-btn">
              <Camera size={28} strokeWidth={2.4} className="text-white drop-shadow-sm" aria-hidden="true" />
            </div>
            <span className="dock-action-label scan-label">
              <span className="scan-ai-badge">AI</span> Scan receipt
            </span>
          </button>

          {/* Action 3: Add Expense (Right) */}
          <button
            type="button"
            role="menuitem"
            className="dock-action-item dock-item-right group"
            onClick={() => {
              closeAddMenu();
              onAdd("EXPENSE");
            }}
            aria-label="Add expense"
          >
            <div className="dock-action-btn expense-btn">
              <Receipt size={26} strokeWidth={2.4} className="text-white drop-shadow-sm" aria-hidden="true" />
            </div>
            <span className="dock-action-label">Add expense</span>
          </button>
        </div>
      )}

      {/* 5. Floating Bottom Dock Bar */}
      <nav className="mobile-bottom-nav floating-dock-bar" aria-label="Mobile navigation">
        {/* Left Wing: Overview & History */}
        <div className="floating-dock-wing left">
          {LEFT_ITEMS.map(renderItem)}
        </div>

        {/* Central Elevated Add (+) Button */}
        <div className="floating-dock-center">
          <button
            type="button"
            className={`mobile-add floating-dock-add ${addMenuOpen ? "is-open" : ""}`}
            aria-label={addMenuOpen ? "Close add menu" : "Add transaction"}
            aria-expanded={addMenuOpen}
            onClick={toggleAddMenu}
          >
            <Plus size={24} strokeWidth={2.8} className="floating-dock-add-icon" aria-hidden="true" />
          </button>
        </div>

        {/* Right Wing: Budget & More */}
        <div className="floating-dock-wing right">
          {RIGHT_ITEMS.map(renderItem)}

          {/* "More" Button replacing Insights */}
          <button
            type="button"
            className={`floating-dock-link ${isMoreActive ? "active is-active" : ""}`}
            aria-label="More options"
            aria-expanded={moreOpen}
            aria-controls="mobile-more-drawer"
            onClick={() => (moreOpen ? closeDrawer() : openDrawer())}
          >
            <div className="floating-dock-item">
              <div className={`floating-dock-icon-wrap ${isMoreActive ? "is-raised" : ""}`}>
                <Menu
                  size={isMoreActive ? 22 : 20}
                  strokeWidth={isMoreActive ? 2.4 : 1.9}
                  className="floating-dock-icon"
                  aria-hidden="true"
                />
              </div>
              <span className="floating-dock-label">More</span>
            </div>
          </button>
        </div>
      </nav>
    </>,
    document.body,
  );
}
