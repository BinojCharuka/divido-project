"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, BookOpen, CalendarDays, CircleHelp, LogOut, Moon, Settings, Sun } from "lucide-react";
import { Brand } from "@/components/ui/Brand";
import { IconButton } from "@/components/ui/IconButton";
import { getCurrentMonth } from "@/lib/formatting/dates";
import { useDividoTheme } from "@/lib/theme";
import { locationLabel } from "./navigation";

/** Top bar matching desktop and mobile Divido layouts. */
export function TopBar({
  userName,
  email,
  initials,
  onHelp,
  onSignOut,
}: {
  userName: string;
  email: string;
  initials: string;
  onHelp: () => void;
  onSignOut: () => void;
}) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useDividoTheme();
  const currentMonth = getCurrentMonth();
  // Remember the page the menu was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const menuOpen = openOn === pathname;
  const setMenuOpen = useCallback((open: boolean) => setOpenOn(open ? pathname : null), [pathname]);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the menu on Escape or a click outside it.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [menuOpen, setMenuOpen]);

  const menuAction = (action: () => void) => () => {
    setMenuOpen(false);
    action();
  };

  const getDesktopHeaders = () => {
    if (pathname.startsWith("/dashboard")) return { eyebrow: "OVERVIEW", title: "Good morning, ready to plan?" };
    if (pathname.startsWith("/transactions")) return { eyebrow: "DIVIDO", title: "History" };
    if (pathname.startsWith("/budget")) return { eyebrow: "DIVIDO", title: "Budget" };
    if (pathname.startsWith("/insights")) return { eyebrow: "DIVIDO", title: "Insights" };
    if (pathname.startsWith("/settings")) return { eyebrow: "DIVIDO", title: "Settings" };
    return { eyebrow: "DIVIDO", title: locationLabel(pathname) };
  };

  const { eyebrow, title } = getDesktopHeaders();

  return (
    <header className="topbar">
      <div className="header-content flex items-center justify-between w-full">
        {/* Mobile Logo / Heading */}
        <div className="md:hidden">
          {pathname.startsWith("/dashboard") ? (
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-bold tracking-[0.2em] text-[#34d399] uppercase block leading-tight">
                OVERVIEW
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight leading-tight mt-0.5">
                Good morning, ready to plan?
              </h1>
            </div>
          ) : (
            <Link href="/dashboard" className="header-brand" aria-label="Divido dashboard">
              <Brand />
            </Link>
          )}
        </div>

        {/* Desktop Eyebrow and Page Heading */}
        <div className="hidden md:flex flex-col text-left">
          <span className="text-[10px] font-bold tracking-[0.2em] text-[#34d399] uppercase block leading-tight">
            {eyebrow}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-tight mt-0.5">
            {title}
          </h2>
        </div>

        {/* Right Actions */}
        <div className="header-actions flex items-center gap-3">
          {/* Desktop Month Pill */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#0d1611] border border-white/10 text-xs text-zinc-300 font-medium shadow-xs">
            <CalendarDays size={14} className="text-[#34d399]" />
            <span>{currentMonth}</span>
          </div>

          {/* Mobile Bell Button */}
          <div className="md:hidden relative flex items-center">
            <button
              type="button"
              className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors cursor-pointer relative"
              aria-label="Notifications"
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Bell size={18} strokeWidth={2} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-[#07100b]" />
            </button>
          </div>

          <div className="profile-wrap header-profile relative" ref={menuRef}>
            <button
              type="button"
              className="profile-button focus:outline-hidden"
              aria-label="Open profile menu"
              aria-haspopup="true"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <span className="avatar w-9 h-9 rounded-full bg-[#7bc8a4] text-[#07100b] font-bold flex items-center justify-center text-xs shrink-0 cursor-pointer shadow-xs hover:opacity-90 transition-opacity" aria-hidden="true">
                {initials}
              </span>
            </button>
            {menuOpen && (
              <div className="profile-dropdown">
                <strong>{userName}</strong>
                <span>{email}</span>
                <Link href="/settings" className="profile-dropdown-link" onClick={() => setMenuOpen(false)}>
                  <Settings size={16} aria-hidden="true" />
                  Settings & preferences
                </Link>
                <Link href="/reflection" className="profile-dropdown-link" onClick={() => setMenuOpen(false)}>
                  <BookOpen size={16} aria-hidden="true" />
                  Monthly reflection
                </Link>
                <button type="button" onClick={menuAction(onHelp)}>
                  <CircleHelp size={16} aria-hidden="true" />
                  How Divido works
                </button>
                <button type="button" onClick={menuAction(onSignOut)}>
                  <LogOut size={16} aria-hidden="true" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
