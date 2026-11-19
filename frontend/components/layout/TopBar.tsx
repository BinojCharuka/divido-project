"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, CircleHelp, LayoutDashboard, LogOut, Moon, Settings, Sun } from "lucide-react";
import { Brand } from "@/components/ui/Brand";
import { IconButton } from "@/components/ui/IconButton";
import { useDividoTheme } from "@/lib/theme";
import { locationLabel } from "./navigation";

/** Top bar: breadcrumb, theme switch and the profile menu. */
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

  return (
    <header className="topbar">
      <div className="header-content">
        <Link href="/dashboard" className="header-brand" aria-label="Divido dashboard">
          <Brand />
        </Link>
        <div className="header-location">
          <LayoutDashboard size={15} aria-hidden="true" />
          <span aria-hidden="true">/</span>
          <span>{locationLabel(pathname)}</span>
        </div>
        <div className="header-actions">
          <span className="topbar-divider" />
          <IconButton
            icon={theme === "light" ? Moon : Sun}
            label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            className="icon-button theme-toggle"
            onClick={toggleTheme}
          />
          <div className="profile-wrap header-profile" ref={menuRef}>
            <button
              type="button"
              className="profile-button"
              aria-label="Open profile menu"
              aria-haspopup="true"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <span className="avatar avatar-small" aria-hidden="true">
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
