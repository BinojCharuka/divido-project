"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { getCurrentMonth, isValidMonth } from "@/lib/formatting/dates";

/**
 * The selected month lives in the URL (`?month=YYYY-MM`), so reloads, links between
 * Budget and Dashboard, and the back button keep the month. A missing or malformed
 * value falls back to the current month in the application timezone.
 */
export function useMonthParam(): [string, (month: string) => void] {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const raw = searchParams.get("month");

  let month = getCurrentMonth();
  if (isValidMonth(raw)) {
    month = raw;
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem("divido-active-month", raw);
      } catch {
        // Storage unavailable
      }
    }
  } else if (typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem("divido-active-month");
      if (isValidMonth(stored)) {
        month = stored;
      }
    } catch {
      // Storage unavailable
    }
  }

  const setMonth = useCallback(
    (next: string) => {
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem("divido-active-month", next);
        } catch {
          // Storage unavailable
        }
      }
      router.push(`${pathname}?month=${next}`, { scroll: false });
    },
    [router, pathname],
  );
  return [month, setMonth];
}
