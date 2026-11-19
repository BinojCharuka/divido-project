/**
 * Route metadata mapping for Divido's full-screen page transitions.
 * Dynamically resolves the destination page title, eyebrow category, and subtitle.
 */

export interface RouteMetadata {
  title: string;
  eyebrow: string;
  subtitle: string;
}

const ROUTE_MAP: { prefix: string; exact?: boolean; metadata: RouteMetadata }[] = [
  {
    prefix: "/dashboard",
    metadata: {
      title: "Overview",
      eyebrow: "DASHBOARD",
      subtitle: "Financial summary & available balance",
    },
  },
  {
    prefix: "/transactions",
    metadata: {
      title: "Transaction History",
      eyebrow: "RECORDS",
      subtitle: "Income & expense transaction log",
    },
  },
  {
    prefix: "/budget",
    metadata: {
      title: "Monthly Budget",
      eyebrow: "PLANNING",
      subtitle: "Spending limits & category targets",
    },
  },
  {
    prefix: "/insights",
    metadata: {
      title: "Financial Insights",
      eyebrow: "ANALYTICS",
      subtitle: "Factual spending patterns & observations",
    },
  },
  {
    prefix: "/reflection",
    metadata: {
      title: "Monthly Reflection",
      eyebrow: "REVIEW",
      subtitle: "Habits, milestones & monthly takeaways",
    },
  },
  {
    prefix: "/categories",
    metadata: {
      title: "Expense Categories",
      eyebrow: "MANAGEMENT",
      subtitle: "Custom & standard budget categories",
    },
  },
  {
    prefix: "/income-sources",
    metadata: {
      title: "Income Sources",
      eyebrow: "MANAGEMENT",
      subtitle: "Configured streams & earning channels",
    },
  },
  {
    prefix: "/settings",
    metadata: {
      title: "Settings & Preferences",
      eyebrow: "ACCOUNT",
      subtitle: "Profile details & workspace settings",
    },
  },
  {
    prefix: "/onboarding",
    metadata: {
      title: "Welcome to Divido",
      eyebrow: "SETUP",
      subtitle: "Initial workspace configuration",
    },
  },
  {
    prefix: "/",
    exact: true,
    metadata: {
      title: "Overview",
      eyebrow: "DASHBOARD",
      subtitle: "Financial summary & available balance",
    },
  },
];

export function getRouteMetadata(pathname: string): RouteMetadata {
  const clean = pathname.split("?")[0].split("#")[0];

  for (const item of ROUTE_MAP) {
    if (item.exact) {
      if (clean === item.prefix) return item.metadata;
    } else {
      if (clean === item.prefix || clean.startsWith(`${item.prefix}/`)) {
        return item.metadata;
      }
    }
  }

  // Fallback
  return {
    title: "Divido Workspace",
    eyebrow: "DIVIDO",
    subtitle: "Personal budgeting workspace",
  };
}
