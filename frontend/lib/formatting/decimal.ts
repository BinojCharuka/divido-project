import { formatMoney } from "@/lib/formatting/money";

/**
 * Exact arithmetic on API decimal strings ("1234.50", "-10.00") in whole cents.
 * Used only to place backend figures on screen (bars, signs); the figures
 * themselves always come from the API (DEC-028 decimal policy).
 */

const SIGNED_AMOUNT = /^([-+]?)(\d+)(?:\.(\d{1,2}))?$/;
const ZERO = BigInt(0);
const HUNDRED = BigInt(100);

/** Whole cents for a decimal string, or null when it is not one. */
export function centsOf(value: string | null | undefined): bigint | null {
  if (value === null || value === undefined) return null;
  const match = value.trim().match(SIGNED_AMOUNT);
  if (!match) return null;
  const cents = BigInt(match[2]) * HUNDRED + BigInt((match[3] ?? "").padEnd(2, "0"));
  return match[1] === "-" ? -cents : cents;
}

export function isNegativeAmount(value: string | null | undefined): boolean {
  const cents = centsOf(value);
  return cents !== null && cents < ZERO;
}

export function isPositiveAmount(value: string | null | undefined): boolean {
  const cents = centsOf(value);
  return cents !== null && cents > ZERO;
}

/** "12,345.60" with no currency and no sign; the label or a prefix carries the meaning. */
export function amountDigits(value: string | null | undefined): string {
  return formatMoney(value ?? "0.00").replace(/^LKR /, "");
}

/** Bar width for `part` of `whole`, clamped to 0–100. Zero when there is no whole. */
export function shareOf(part: string | null | undefined, whole: string | null | undefined): number {
  const p = centsOf(part);
  const w = centsOf(whole);
  if (p === null || w === null || w <= ZERO || p <= ZERO) return 0;
  const tenths = Number((p * BigInt(1000)) / w) / 10;
  return Math.min(100, tenths);
}

/** The bar width for a backend `percentUsed` string ("55.0"), clamped to 0–100. */
export function percentWidth(percentUsed: string | null | undefined): number {
  if (!percentUsed) return 0;
  const n = Number(percentUsed);
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0;
}
