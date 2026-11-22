"use client";

import { usePathname } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { getCurrentMonth, getTimeGreeting } from "@/lib/formatting/dates";
import { locationLabel } from "./navigation";

/**
 * Top bar matching desktop Divido layout.
 * Hidden on mobile screens (< 768px) where full viewport height is dedicated to content
 * and navigation is handled by the bottom dock & slide-over drawer.
 */
export function TopBar({
  userName: _userName,
  email: _email,
  initials: _initials,
  onHelp: _onHelp,
  onSignOut: _onSignOut,
}: {
  userName: string;
  email: string;
  initials: string;
  onHelp: () => void;
  onSignOut: () => void;
}) {
  const pathname = usePathname();
  const currentMonth = getCurrentMonth();

  const greeting = getTimeGreeting();

  const getDesktopHeaders = () => {
    if (pathname.startsWith("/dashboard")) return { eyebrow: "OVERVIEW", title: `${greeting}, ready to plan?` };
    if (pathname.startsWith("/transactions")) return { eyebrow: "DIVIDO", title: "History" };
    if (pathname.startsWith("/budget")) return { eyebrow: "DIVIDO", title: "Budget" };
    if (pathname.startsWith("/insights")) return { eyebrow: "DIVIDO", title: "Insights" };
    if (pathname.startsWith("/settings")) return { eyebrow: "DIVIDO", title: "Settings" };
    return { eyebrow: "DIVIDO", title: locationLabel(pathname) };
  };

  const { eyebrow, title } = getDesktopHeaders();

  return (
    <header className="topbar hidden md:flex">
      <div className="header-content flex items-center justify-between w-full">
        {/* Desktop Eyebrow and Page Heading */}
        <div className="flex flex-col text-left">
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
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#0d1611] border border-white/10 text-xs text-zinc-300 font-medium shadow-xs">
            <CalendarDays size={14} className="text-[#34d399]" />
            <span>{currentMonth}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
