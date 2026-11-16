"use client";

import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { formatMonthYear, getCurrentMonth, shiftMonth } from "@/lib/formatting/dates";

/**
 * Month picker for month-based pages: previous/next steps plus a list of the 27
 * months up to three ahead of the current month (app timezone), always including
 * the selected one.
 */
export function MonthSelector({ month, onChange }: { month: string; onChange: (month: string) => void }) {
  const current = getCurrentMonth();
  const recent = Array.from({ length: 27 }, (_, i) => shiftMonth(current, 3 - i));
  // A month from a link or older record stays selectable even outside the recent range.
  const options = recent.includes(month) ? recent : [...recent, month].sort().reverse();
  if (!options.includes(month)) options.push(month);
  options.sort().reverse();
  return (
    <div className="month-selector-group">
      <button type="button" className="icon-button month-step" aria-label="Previous month" onClick={() => onChange(shiftMonth(month, -1))}>
        <ChevronLeft size={16} aria-hidden="true" />
      </button>
      <div className="month-selector">
        <CalendarDays size={16} aria-hidden="true" />
        <select aria-label="Select month" value={month} onChange={(e) => onChange(e.target.value)}>
          {options.map((value) => (
            <option key={value} value={value}>
              {formatMonthYear(value)}
            </option>
          ))}
        </select>
        <ChevronDown size={14} aria-hidden="true" />
      </div>
      <button type="button" className="icon-button month-step" aria-label="Next month" onClick={() => onChange(shiftMonth(month, 1))}>
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
