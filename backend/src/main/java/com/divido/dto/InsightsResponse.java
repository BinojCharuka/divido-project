package com.divido.dto;

import com.divido.entity.KakeiboGroup;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

/**
 * INSIGHT-001 response (DIV-027). Money values are decimal strings with two places;
 * percentages are strings with one place, or {@code null} when the base is zero.
 * Observations carry facts only; the frontend renders the approved wording.
 */
public record InsightsResponse(String month,
                               String periodStart,
                               String periodEnd,
                               String asOf,
                               boolean partialMonth,
                               int minimumSpendingDays,
                               long spendingDays,
                               boolean insufficientHistory,
                               String totalSpent,
                               List<Group> groups,
                               Comparison comparison,
                               List<TrendMonth> trend,
                               String lookbackStart,
                               String lookbackEnd,
                               List<Observation> observations) {

    public record Group(KakeiboGroup group, String spent, String sharePercent, long expenseCount) {
    }

    public record Comparison(String currentStart,
                             String currentEnd,
                             String previousStart,
                             String previousEnd,
                             String currentSpent,
                             String previousSpent,
                             String changePercent,
                             long currentSpendingDays,
                             long previousSpendingDays,
                             List<GroupChange> groups) {
    }

    public record GroupChange(KakeiboGroup group, String currentSpent, String previousSpent, String changePercent) {
    }

    /** {@code totalSpent} is {@code null} and {@code hasActivity} false before the first transaction. */
    public record TrendMonth(String month, String totalSpent, boolean hasActivity, boolean partial) {
    }

    /** One of the four DEC-031 observation types; fields not used by a type are omitted. */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record Observation(String type,
                              KakeiboGroup group,
                              String spent,
                              String sharePercent,
                              Long spendingDays,
                              String budget,
                              String overBy,
                              String currentSpent,
                              String previousSpent,
                              String changePercent,
                              String categoryId,
                              String categoryName,
                              Long distinctDays,
                              Long transactionCount,
                              List<String> dates) {

        public static Observation largestGroup(KakeiboGroup group, String spent, String sharePercent, long spendingDays) {
            return new Observation("LARGEST_GROUP", group, spent, sharePercent, spendingDays,
                    null, null, null, null, null, null, null, null, null, null);
        }

        public static Observation groupOverPlan(KakeiboGroup group, String budget, String spent, String overBy) {
            return new Observation("GROUP_OVER_PLAN", group, spent, null, null,
                    budget, overBy, null, null, null, null, null, null, null, null);
        }

        public static Observation monthChange(String currentSpent, String previousSpent, String changePercent) {
            return new Observation("MONTH_CHANGE", null, null, null, null,
                    null, null, currentSpent, previousSpent, changePercent, null, null, null, null, null);
        }

        public static Observation repeatedCategory(String categoryId, String categoryName, KakeiboGroup group,
                                                   long distinctDays, long transactionCount, List<String> dates) {
            return new Observation("REPEATED_CATEGORY", group, null, null, null,
                    null, null, null, null, null, categoryId, categoryName, distinctDays, transactionCount, dates);
        }
    }
}
