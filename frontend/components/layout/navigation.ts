import {
  BarChart3,
  BookOpen,
  History,
  LayoutGrid,
  Settings,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = { href: string; label: string; icon: LucideIcon; prefixes: string[] };

export const DASHBOARD: NavItem = { href: "/dashboard", label: "Overview", icon: LayoutGrid, prefixes: ["/dashboard"] };
export const TRANSACTIONS: NavItem = { href: "/transactions", label: "History", icon: History, prefixes: ["/transactions"] };
export const BUDGET: NavItem = { href: "/budget", label: "Budget", icon: Wallet, prefixes: ["/budget"] };
export const INSIGHTS: NavItem = { href: "/insights", label: "Insights", icon: BarChart3, prefixes: ["/insights"] };
export const REFLECTION: NavItem = { href: "/reflection", label: "Monthly reflection", icon: BookOpen, prefixes: ["/reflection"] };
export const SETTINGS: NavItem = {
  href: "/settings",
  label: "Settings",
  icon: Settings,
  prefixes: ["/settings", "/categories", "/income-sources"],
};

export const PRIMARY_NAV = [DASHBOARD, TRANSACTIONS, BUDGET, INSIGHTS];
export const SECONDARY_NAV = [SETTINGS];

export function isActive(item: NavItem, pathname: string): boolean {
  return item.prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

const TITLES: [string, string][] = [
  ["/categories", "Expense categories"],
  ["/income-sources", "Income sources"],
  ...[...PRIMARY_NAV, ...SECONDARY_NAV].map((item): [string, string] => [item.href, item.label]),
];

/** The breadcrumb label for the current route. */
export function locationLabel(pathname: string): string {
  return TITLES.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))?.[1] ?? "Dashboard";
}
