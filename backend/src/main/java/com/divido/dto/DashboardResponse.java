package com.divido.dto;

import com.divido.entity.KakeiboGroup;

import java.util.List;

/**
 * {@code GET /api/v1/dashboard} (DIV-026). Planned fields come from the month's
 * budget and are {@code null} when {@code hasBudget} is false; recorded fields are
 * always real totals of the user's transactions in the month, "0.00" when none.
 */
public record DashboardResponse(
        String month,
        String periodStart,
        String periodEnd,
        boolean hasBudget,
        // Planned (from the monthly budget)
        String plannedIncome,
        String savingsTarget,
        String allocationTotal,
        String plannedTotal,
        String overAllocationAmount,
        Boolean overAllocated,
        // Recorded (from transactions)
        String recordedIncome,
        long incomeTransactionCount,
        String totalSpent,
        long expenseTransactionCount,
        List<Group> groups
) {

    /**
     * {@code budget}, {@code remaining}, {@code overBudget} are null without a budget;
     * {@code percentUsed} is also null when the group's budget is zero.
     */
    public record Group(
            KakeiboGroup group,
            String budget,
            String spent,
            String remaining,
            String percentUsed,
            Boolean overBudget,
            long expenseCount
    ) {
    }
}
