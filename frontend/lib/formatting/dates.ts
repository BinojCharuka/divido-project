/**
 * Date formatting and calculation utilities for Divido.
 * Follows docs/02-ux-ui/wireframes.md and timezone considerations.
 */

/** Returns today's date in local ISO YYYY-MM-DD format. */
export function getTodayIso(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Returns yesterday's date in local ISO YYYY-MM-DD format. */
export function getYesterdayIso(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Formats a YYYY-MM-DD string into a human-readable format like "Oct 12, 2026". */
export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!year || !month || !day) return dateStr;

  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Returns "Today", "Yesterday", or a formatted date like "Oct 12, 2026". */
export function formatDateRelative(dateStr: string): string {
  const today = getTodayIso();
  if (dateStr === today) return "Today";
  const yesterday = getYesterdayIso();
  if (dateStr === yesterday) return "Yesterday";
  return formatDateDisplay(dateStr);
}

/** Formats "YYYY-MM" or "YYYY-MM-DD" into "October 2026". */
export function formatMonthYear(monthStr: string): string {
  if (!monthStr) return "";
  const parts = monthStr.split("-").map(Number);
  const year = parts[0];
  const month = parts[1];
  if (!year || !month) return monthStr;

  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/** Gets the current month in "YYYY-MM" format. */
export function getCurrentMonth(): string {
  return getTodayIso().slice(0, 7);
}

/** Returns start and end dates for a given month "YYYY-MM". */
export function getMonthDateRange(yearMonth: string): { from: string; to: string } {
  const [year, month] = yearMonth.split("-").map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  const monthPadded = String(month).padStart(2, "0");
  return {
    from: `${year}-${monthPadded}-01`,
    to: `${year}-${monthPadded}-${String(lastDay).padStart(2, "0")}`,
  };
}

/** Returns recent months list safely avoiding day-31 rollover bugs. */
export function getRecentMonths(count = 6): { val: string; label: string }[] {
  const now = new Date();
  return Array.from({ length: count }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
    return { val, label };
  });
}
