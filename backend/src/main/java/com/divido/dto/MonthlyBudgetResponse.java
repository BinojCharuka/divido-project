package com.divido.dto;

import com.divido.entity.KakeiboGroup;
import com.divido.entity.MonthlyBudget;
import com.divido.service.BudgetCalculator;

import java.time.Instant;
import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.Map;

/** A stored monthly plan plus the derived figures from {@link BudgetCalculator}. */
public record MonthlyBudgetResponse(
        String month,
        String plannedIncome,
        String savingsTarget,
        Map<KakeiboGroup, String> allocations,
        String allocationTotal,
        String plannedTotal,
        String overAllocationAmount,
        boolean overAllocated,
        Instant createdAt,
        Instant updatedAt
) {

    public static MonthlyBudgetResponse from(MonthlyBudget budget, BudgetCalculator.PlanFigures figures) {
        Map<KakeiboGroup, String> allocations = new LinkedHashMap<>();
        for (KakeiboGroup group : KakeiboGroup.values()) {
            allocations.put(group, BudgetCalculator.money(budget.getAllocation(group)).toPlainString());
        }
        return new MonthlyBudgetResponse(
                YearMonth.from(budget.getMonth()).toString(),
                BudgetCalculator.money(budget.getPlannedIncome()).toPlainString(),
                BudgetCalculator.money(budget.getSavingsTarget()).toPlainString(),
                allocations,
                figures.allocationTotal().toPlainString(),
                figures.plannedTotal().toPlainString(),
                figures.overAllocationAmount().toPlainString(),
                figures.overAllocated(),
                budget.getCreatedAt(),
                budget.getUpdatedAt());
    }
}
