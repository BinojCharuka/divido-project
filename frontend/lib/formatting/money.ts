import type { TransactionType } from "@/types/transaction";

/**
 * Money formatting and validation utilities for Divido (currency: LKR).
 * Follows docs/02-ux-ui/design-system.md and docs/04-architecture/frontend-architecture.md.
 */

const CURRENCY_CODE = "LKR";

/**
 * Formats an amount string or number to a clean LKR string.
 * Uses tabular figures formatting friendly string: "LKR 2,400.00".
 */
export function formatMoney(amount: string | number | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") {
    return `${CURRENCY_CODE} 0.00`;
  }

  const num = typeof amount === "number" ? amount : parseFloat(amount);
  if (isNaN(num)) {
    return `${CURRENCY_CODE} 0.00`;
  }

  const parts = Math.abs(num).toFixed(2).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const formatted = parts.join(".");

  return `${CURRENCY_CODE} ${formatted}`;
}

/**
 * Formats an amount with an explicit +/- sign and currency code.
 * Example: "+ LKR 85,000.00" or "- LKR 2,400.00"
 */
export function formatSignedMoney(
  amount: string | number,
  type: TransactionType | "INCOME" | "EXPENSE",
): { sign: string; text: string; full: string } {
  const isIncome = type === "INCOME";
  const sign = isIncome ? "+" : "-";
  const formatted = formatMoney(amount);
  return {
    sign,
    text: formatted,
    full: `${sign} ${formatted}`,
  };
}

/**
 * Validates that an amount string is a valid positive decimal number with up to 2 decimals.
 * Rejects 0, negatives, letters, and excess precision.
 */
export function isValidMoneyAmount(value: string): boolean {
  if (!value || typeof value !== "string") return false;
  const trimmed = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return false;
  const num = parseFloat(trimmed);
  return !isNaN(num) && num > 0;
}

/**
 * Normalizes user input for an amount to a standardized string format "1234.56" or "1234.00".
 */
export function normalizeMoneyInput(value: string): string {
  const trimmed = value.trim();
  const num = parseFloat(trimmed);
  if (isNaN(num)) return "0.00";
  return num.toFixed(2);
}

/**
 * Strips accidental leading zeros while preserving valid numbers, decimals (e.g. "0.5"), and single "0".
 * Handles cases like "0564" -> "564", "00" -> "0", "007" -> "7".
 */
export function cleanNumberString(raw: string): string {
  if (!raw) return "";
  let val = raw.replace(/[^0-9.]/g, "");
  const firstDot = val.indexOf(".");
  if (firstDot !== -1) {
    val = val.slice(0, firstDot + 1) + val.slice(firstDot + 1).replace(/\./g, "");
  }
  if (val.startsWith("0") && !val.startsWith("0.") && val.length > 1) {
    val = val.replace(/^0+/, "") || "0";
  }
  return val;
}

