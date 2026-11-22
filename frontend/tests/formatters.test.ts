import { describe, expect, it } from "vitest";
import {
  formatDateDisplay,
  formatDateRelative,
  formatMonthYear,
  getMonthDateRange,
  getTodayIso,
  getYesterdayIso,
  getCurrentHour,
  getTimeGreeting,
} from "@/lib/formatting/dates";
import {
  formatMoney,
  formatSignedMoney,
  isValidMoneyAmount,
  normalizeMoneyInput,
  cleanNumberString,
} from "@/lib/formatting/money";

describe("Money formatting & validation", () => {
  it("formats positive numbers to LKR with commas and two decimals", () => {
    expect(formatMoney("2400")).toBe("LKR 2,400.00");
    expect(formatMoney(85000)).toBe("LKR 85,000.00");
    expect(formatMoney("12.5")).toBe("LKR 12.50");
    expect(formatMoney("0")).toBe("LKR 0.00");
    expect(formatMoney(null)).toBe("LKR 0.00");
    expect(formatMoney("invalid")).toBe("LKR 0.00");
  });

  it("formats signed money with directional sign", () => {
    expect(formatSignedMoney("2400.00", "EXPENSE")).toEqual({
      sign: "-",
      text: "LKR 2,400.00",
      full: "- LKR 2,400.00",
    });
    expect(formatSignedMoney("85000.00", "INCOME")).toEqual({
      sign: "+",
      text: "LKR 85,000.00",
      full: "+ LKR 85,000.00",
    });
  });

  it("validates money amounts correctly", () => {
    expect(isValidMoneyAmount("100")).toBe(true);
    expect(isValidMoneyAmount("25.50")).toBe(true);
    expect(isValidMoneyAmount("0.05")).toBe(true);

    expect(isValidMoneyAmount("0")).toBe(false);
    expect(isValidMoneyAmount("-10")).toBe(false);
    expect(isValidMoneyAmount("abc")).toBe(false);
    expect(isValidMoneyAmount("10.555")).toBe(false); // excess precision
    expect(isValidMoneyAmount("")).toBe(false);
  });

  it("normalizes money input to two decimal string", () => {
    expect(normalizeMoneyInput("100")).toBe("100.00");
    expect(normalizeMoneyInput("2400.5")).toBe("2400.50");
    expect(normalizeMoneyInput("invalid")).toBe("0.00");
  });

  it("cleans number inputs and strips awkward leading zeros across the site", () => {
    expect(cleanNumberString("0564")).toBe("564");
    expect(cleanNumberString("05")).toBe("5");
    expect(cleanNumberString("007")).toBe("7");
    expect(cleanNumberString("0")).toBe("0");
    expect(cleanNumberString("00")).toBe("0");
    expect(cleanNumberString("0.5")).toBe("0.5");
    expect(cleanNumberString("0.00")).toBe("0.00");
    expect(cleanNumberString("150000")).toBe("150000");
    expect(cleanNumberString("")).toBe("");
  });
});

describe("Date formatting & utilities", () => {
  it("formats display dates", () => {
    expect(formatDateDisplay("2026-10-12")).toBe("Oct 12, 2026");
  });

  it("formats relative dates for today and yesterday", () => {
    const today = getTodayIso();
    const yesterday = getYesterdayIso();
    expect(formatDateRelative(today)).toBe("Today");
    expect(formatDateRelative(yesterday)).toBe("Yesterday");
    expect(formatDateRelative("2025-01-01")).toBe("Jan 1, 2025");
  });

  it("formats month and year", () => {
    expect(formatMonthYear("2026-10")).toBe("October 2026");
    expect(formatMonthYear("2026-10-15")).toBe("October 2026");
  });

  it("calculates month date ranges", () => {
    const rangeOct = getMonthDateRange("2026-10");
    expect(rangeOct).toEqual({ from: "2026-10-01", to: "2026-10-31" });

    const rangeFeb = getMonthDateRange("2026-02");
    expect(rangeFeb).toEqual({ from: "2026-02-01", to: "2026-02-28" });
  });

  it("returns time-of-day greetings based on hour in application timezone", () => {
    // 08:00 AM UTC+5:30 -> 02:30 AM UTC
    const morningUtc = new Date("2026-11-22T02:30:00Z");
    expect(getCurrentHour(morningUtc)).toBe(8);
    expect(getTimeGreeting(morningUtc)).toBe("Good morning");

    // 02:00 PM UTC+5:30 -> 08:30 AM UTC
    const afternoonUtc = new Date("2026-11-22T08:30:00Z");
    expect(getCurrentHour(afternoonUtc)).toBe(14);
    expect(getTimeGreeting(afternoonUtc)).toBe("Good afternoon");

    // 08:00 PM UTC+5:30 -> 02:30 PM UTC
    const eveningUtc = new Date("2026-11-22T14:30:00Z");
    expect(getCurrentHour(eveningUtc)).toBe(20);
    expect(getTimeGreeting(eveningUtc)).toBe("Good evening");

    // 01:00 AM UTC+5:30 -> 07:30 PM (previous day) UTC
    const nightUtc = new Date("2026-11-21T19:30:00Z");
    expect(getCurrentHour(nightUtc)).toBe(1);
    expect(getTimeGreeting(nightUtc)).toBe("Good evening");
  });
});
