package com.divido.dto;

import java.util.Map;

/**
 * Body of {@code PUT /api/v1/budgets/{month}}. Amounts are decimal strings; the
 * service validates them, so this record carries no Bean Validation rules. The
 * month and the owner come from the path and the session, never from the body.
 */
public record MonthlyBudgetRequest(
        String plannedIncome,
        String savingsTarget,
        Map<String, String> allocations
) {
}
