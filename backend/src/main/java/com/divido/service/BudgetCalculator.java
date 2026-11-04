package com.divido.service;

import com.divido.entity.KakeiboGroup;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;
import java.util.Objects;

/**
 * The single implementation of the DIV-017 budget formulas, shared by the Budget
 * and Dashboard APIs so the two can never disagree.
 *
 * <ul>
 *   <li>{@code allocationTotal = NEEDS + WANTS + CULTURE + UNEXPECTED}</li>
 *   <li>{@code plannedTotal = savingsTarget + allocationTotal}</li>
 *   <li>{@code overAllocationAmount = plannedTotal - plannedIncome}; positive means the
 *       plan exceeds planned income, zero or negative means it fits (a negative value is
 *       the part of planned income not yet planned). Saving is never blocked by it.</li>
 *   <li>{@code remaining = budget - spent}; negative means overspent, never clamped.</li>
 *   <li>{@code percentUsed = spent / budget * 100}, one decimal place, HALF_UP; undefined
 *       ({@code null}) when the budget is zero.</li>
 * </ul>
 *
 * All inputs have at most two decimal places, so sums and differences are exact; every
 * monetary result is returned with scale 2. Only {@code percentUsed} rounds.
 */
public final class BudgetCalculator {

    public static final int MONEY_SCALE = 2;
    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private BudgetCalculator() {
    }

    public record PlanFigures(BigDecimal allocationTotal,
                              BigDecimal plannedTotal,
                              BigDecimal overAllocationAmount,
                              boolean overAllocated) {
    }

    public static PlanFigures plan(BigDecimal plannedIncome,
                                   BigDecimal savingsTarget,
                                   Map<KakeiboGroup, BigDecimal> allocations) {
        Objects.requireNonNull(plannedIncome, "plannedIncome");
        Objects.requireNonNull(savingsTarget, "savingsTarget");
        BigDecimal allocationTotal = BigDecimal.ZERO;
        for (KakeiboGroup group : KakeiboGroup.values()) {
            BigDecimal value = allocations.get(group);
            if (value == null) {
                throw new IllegalArgumentException("Missing allocation for " + group);
            }
            allocationTotal = allocationTotal.add(value);
        }
        BigDecimal plannedTotal = savingsTarget.add(allocationTotal);
        BigDecimal overAllocation = plannedTotal.subtract(plannedIncome);
        return new PlanFigures(
                money(allocationTotal),
                money(plannedTotal),
                money(overAllocation),
                overAllocation.signum() > 0);
    }

    public static BigDecimal remaining(BigDecimal budget, BigDecimal spent) {
        return money(budget.subtract(spent));
    }

    /** {@code null} when the budget is zero: a percentage of nothing would mislead. */
    public static BigDecimal percentUsed(BigDecimal budget, BigDecimal spent) {
        if (budget.signum() == 0) {
            return null;
        }
        return spent.multiply(HUNDRED).divide(budget, 1, RoundingMode.HALF_UP);
    }

    public static BigDecimal money(BigDecimal value) {
        // Inputs never exceed scale 2, so UNNECESSARY documents (and enforces) exactness.
        return value.setScale(MONEY_SCALE, RoundingMode.UNNECESSARY);
    }
}
