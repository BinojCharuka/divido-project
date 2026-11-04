import { describe, expect, it } from "vitest";
import {
  emptyBudgetForm,
  fromCents,
  previewPlan,
  toBudgetInput,
  toCents,
  validateBudgetForm,
  type BudgetFormValues,
} from "@/lib/budget/plan";
import {
  getCurrentMonth,
  getMonthDateRange,
  getTodayIso,
  getYesterdayIso,
  isValidMonth,
  shiftMonth,
} from "@/lib/formatting/dates";
import { formatMoney } from "@/lib/formatting/money";

/** Expected values are written out by hand; they are not produced by the code under test. */
function form(income: string, savings: string, n: string, w: string, c: string, u: string): BudgetFormValues {
  return { plannedIncome: income, savingsTarget: savings, allocations: { NEEDS: n, WANTS: w, CULTURE: c, UNEXPECTED: u } };
}

describe("Budget preview (DIV-017 formulas, exact cents)", () => {
  it("matches the reference fixture", () => {
    expect(previewPlan(form("100000.00", "15000.00", "40000.00", "20000.00", "10000.00", "5000.00"))).toEqual({
      allocationTotal: "75000.00",
      plannedTotal: "90000.00",
      overAllocationAmount: "-10000.00",
      overAllocated: false,
    });
  });

  it("flags a plan that exceeds planned income", () => {
    expect(previewPlan(form("80000", "15000", "40000", "20000", "10000", "5000"))).toEqual({
      allocationTotal: "75000.00",
      plannedTotal: "90000.00",
      overAllocationAmount: "10000.00",
      overAllocated: true,
    });
  });

  it("treats an exact match as fitting and one cent over as over-allocated", () => {
    expect(previewPlan(form("90000", "15000", "40000", "20000", "10000", "5000"))?.overAllocationAmount).toBe("0.00");
    expect(previewPlan(form("90000", "15000", "40000", "20000", "10000", "5000"))?.overAllocated).toBe(false);
    const oneCent = previewPlan(form("100.00", "0.01", "100", "0", "0", "0"));
    expect(oneCent?.overAllocationAmount).toBe("0.01");
    expect(oneCent?.overAllocated).toBe(true);
  });

  it("has no floating-point drift (0.1 + 0.2)", () => {
    expect(previewPlan(form("0.30", "0", "0.1", "0.2", "0", "0"))).toEqual({
      allocationTotal: "0.30",
      plannedTotal: "0.30",
      overAllocationAmount: "0.00",
      overAllocated: false,
    });
  });

  it("stays exact at the maximum amount, beyond JavaScript's safe integer cents", () => {
    const max = "9999999999.99";
    const p = previewPlan(form(max, max, max, max, max, max));
    expect(p?.allocationTotal).toBe("39999999999.96");
    expect(p?.plannedTotal).toBe("49999999999.95");
    expect(p?.overAllocationAmount).toBe("39999999999.96");
  });

  it("returns no preview until every field is valid", () => {
    expect(previewPlan(emptyBudgetForm())).toBeNull();
    expect(previewPlan(form("100", "0", "1", "1", "1", ""))).toBeNull();
    expect(previewPlan(form("100", "0", "1", "1", "1", "1.234"))).toBeNull();
  });

  it("converts cents both ways", () => {
    expect(toCents("1250.5")).toBe(BigInt(125050));
    expect(toCents("0")).toBe(BigInt(0));
    expect(toCents("-1")).toBeNull();
    expect(toCents("10000000000.00")).toBeNull();
    expect(fromCents(BigInt(-125050))).toBe("-1250.50");
    expect(fromCents(BigInt(5))).toBe("0.05");
  });
});

describe("Budget form validation (matches backend rules)", () => {
  it("requires every field and accepts zero", () => {
    const errors = validateBudgetForm(emptyBudgetForm());
    expect(Object.keys(errors).sort()).toEqual(
      ["allocations.CULTURE", "allocations.NEEDS", "allocations.UNEXPECTED", "allocations.WANTS", "plannedIncome", "savingsTarget"].sort(),
    );
    expect(validateBudgetForm(form("0", "0", "0", "0", "0", "0"))).toEqual({});
  });

  it("rejects negatives, excess precision, junk and amounts above the maximum", () => {
    const errors = validateBudgetForm(form("-5", "1.234", "abc", "10000000000", "9999999999.99", "1"));
    expect(errors.plannedIncome).toBe("Planned income cannot be negative.");
    expect(errors.savingsTarget).toBe("Savings target must be a number with at most 2 decimal places.");
    expect(errors["allocations.NEEDS"]).toBe("Needs allocation must be a number with at most 2 decimal places.");
    expect(errors["allocations.WANTS"]).toBe("Wants allocation cannot exceed 9999999999.99.");
    expect(errors["allocations.CULTURE"]).toBeUndefined();
  });

  it("sends trimmed strings, never numbers", () => {
    expect(toBudgetInput(form(" 100 ", "0", "1", "2", "3", "4"))).toEqual({
      plannedIncome: "100",
      savingsTarget: "0",
      allocations: { NEEDS: "1", WANTS: "2", CULTURE: "3", UNEXPECTED: "4" },
    });
  });
});

describe("Month and timezone helpers (Asia/Colombo)", () => {
  it("uses the Colombo date, not the browser or UTC date", () => {
    // 18:29:59Z is 23:59:59 in Colombo (UTC+05:30); 18:30Z is already the next day.
    expect(getTodayIso(new Date("2026-10-31T18:29:59Z"))).toBe("2026-10-31");
    expect(getTodayIso(new Date("2026-10-31T18:30:00Z"))).toBe("2026-11-01");
    expect(getCurrentMonth(new Date("2026-10-31T18:30:00Z"))).toBe("2026-11");
    expect(getCurrentMonth(new Date("2026-12-31T18:30:00Z"))).toBe("2027-01");
    expect(getYesterdayIso(new Date("2027-01-01T00:00:00Z"))).toBe("2026-12-31");
    expect(getYesterdayIso(new Date("2028-03-01T06:00:00Z"))).toBe("2028-02-29");
  });

  it("moves between months across year boundaries", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2027-01", -1)).toBe("2026-12");
    expect(shiftMonth("2026-10", 14)).toBe("2027-12");
    expect(shiftMonth("2026-01", -13)).toBe("2024-12");
  });

  it("validates months with the backend's rule", () => {
    expect(isValidMonth("2026-10")).toBe(true);
    for (const bad of ["2026-13", "2026-1", "0000-01", "abc", "", null, undefined, "2026-10-01"]) {
      expect(isValidMonth(bad)).toBe(false);
    }
  });

  it("returns inclusive month ranges including leap February", () => {
    expect(getMonthDateRange("2028-02")).toEqual({ from: "2028-02-01", to: "2028-02-29" });
    expect(getMonthDateRange("2026-02")).toEqual({ from: "2026-02-01", to: "2026-02-28" });
    expect(getMonthDateRange("2026-12")).toEqual({ from: "2026-12-01", to: "2026-12-31" });
  });
});

describe("Exact money display", () => {
  it("formats API decimal strings digit-for-digit", () => {
    expect(formatMoney("39999999999.96")).toBe("LKR 39,999,999,999.96");
    expect(formatMoney("0.30")).toBe("LKR 0.30");
    expect(formatMoney("-1250.50")).toBe("LKR 1,250.50");
    expect(formatMoney("007")).toBe("LKR 7.00");
  });
});
