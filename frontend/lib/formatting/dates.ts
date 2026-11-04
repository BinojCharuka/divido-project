/**
 * Date formatting and calculation utilities for Divido.
 * Follows docs/02-ux-ui/wireframes.md and the DIV-017 month/timezone policy:
 * "today" and "the current month" are taken in the application timezone
 * (Asia/Colombo, the default user timezone), never the browser's local zone, so the
 * UI and the backend agree on which month is current. Transaction dates and months
 * are calendar values (YYYY-MM-DD, YYYY-MM) and are never shifted between zones.
 */

/** DIV-017: the default user timezone; users cannot change it in the MVP yet. */
export const APP_TIME_ZONE = "Asia/Colombo";

/** The calendar date in {@link APP_TIME_ZONE} at `now`, as YYYY-MM-DD. */
export function getTodayIso(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** The day before today in {@link APP_TIME_ZONE}, as YYYY-MM-DD. */
export function getYesterdayIso(now: Date = new Date()): string {
  const [year, month, day] = getTodayIso(now).split("-").map(Number);
  // Pure calendar arithmetic in UTC, so no local DST or offset can shift the day.
  const d = new Date(Date.UTC(year, month - 1, day - 1));
  return d.toISOString().slice(0, 10);
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

/** The current month in {@link APP_TIME_ZONE}, as YYYY-MM. */
export function getCurrentMonth(now: Date = new Date()): string {
  return getTodayIso(now).slice(0, 7);
}

const MONTH_PATTERN = /^[1-9]\d{3}-(0[1-9]|1[0-2])$/;

/** Same rule as the backend: YYYY-MM with a four-digit year from 1000. */
export function isValidMonth(value: string | null | undefined): value is string {
  return !!value && MONTH_PATTERN.test(value);
}

/** Moves a YYYY-MM month by `delta` months, crossing year boundaries correctly. */
export function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split("-").map(Number);
  const index = year * 12 + (m - 1) + delta;
  const nextYear = Math.floor(index / 12);
  const nextMonth = (index % 12) + 1;
  return `${nextYear}-${String(nextMonth).padStart(2, "0")}`;
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
  const current = getCurrentMonth();
  return Array.from({ length: count }).map((_, i) => {
    const val = shiftMonth(current, -i);
    const [year, month] = val.split("-").map(Number);
    const label = new Date(year, month - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
    return { val, label };
  });
}
