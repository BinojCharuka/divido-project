package com.divido.service;

import com.divido.dto.InsightsResponse;
import com.divido.entity.AppUser;
import com.divido.entity.KakeiboGroup;
import com.divido.entity.MonthlyBudget;
import com.divido.entity.TransactionType;
import com.divido.exception.FieldValidationException;
import com.divido.repository.AppUserRepository;
import com.divido.repository.CategoryDayCount;
import com.divido.repository.MonthExpenseTotal;
import com.divido.repository.MonthlyTransactionTotal;
import com.divido.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.TreeSet;
import java.util.UUID;

/**
 * Spending Insights (DIV-027). Computed on request from the session user's own
 * records; nothing is stored. Rules: DEC-031 (four observation types and their
 * thresholds), DEC-032 (lookback), DEC-033 (monthly API), DEC-041 (calculations).
 * Group totals use the same aggregate query and month membership as the dashboard,
 * so the two can never disagree. Descriptions and payment methods are not read.
 */
@Service
@Transactional(readOnly = true)
public class InsightsService {

    private final TransactionRepository transactionRepository;
    private final BudgetService budgetService;
    private final AppUserRepository userRepository;
    private final Clock clock;

    public InsightsService(TransactionRepository transactionRepository,
                           BudgetService budgetService,
                           AppUserRepository userRepository,
                           Clock clock) {
        this.transactionRepository = transactionRepository;
        this.budgetService = budgetService;
        this.userRepository = userRepository;
        this.clock = clock;
    }

    public InsightsResponse getInsights(UUID userId, String rawMonth) {
        String timezone = userRepository.findById(userId).map(AppUser::getTimezone).orElse(null);
        LocalDate today = LocalDate.now(clock.withZone(BudgetMonth.zoneOrDefault(timezone)));
        YearMonth month = rawMonth == null || rawMonth.isEmpty()
                ? YearMonth.from(today)
                : BudgetMonth.parse(rawMonth);
        if (month.isAfter(YearMonth.from(today))) {
            throw new FieldValidationException("month", "Insights are available for the current or a past month.");
        }

        LocalDate periodStart = BudgetMonth.firstDay(month);
        LocalDate periodEnd = BudgetMonth.lastDay(month);
        LocalDate asOf = InsightCalculator.asOf(month, today);
        boolean partial = asOf.isBefore(periodEnd);

        // Month figures: the whole calendar month, exactly like the dashboard.
        Totals monthTotals = expenseTotals(userId, periodStart, periodEnd);
        long spendingDays = transactionRepository.countDistinctExpenseDays(userId, periodStart, periodEnd);

        List<InsightsResponse.Group> groups = new ArrayList<>();
        for (KakeiboGroup group : KakeiboGroup.values()) {
            BigDecimal spent = monthTotals.byGroup.get(group);
            groups.add(new InsightsResponse.Group(group, money(spent),
                    percent(InsightCalculator.sharePercent(spent, monthTotals.total)),
                    monthTotals.counts.get(group)));
        }

        // Comparison: day 1 to asOf against the matching previous-month range (DEC-041).
        LocalDate[] previous = InsightCalculator.previousRange(month, asOf);
        Totals current = expenseTotals(userId, periodStart, asOf);
        Totals prior = expenseTotals(userId, previous[0], previous[1]);
        long currentDays = transactionRepository.countDistinctExpenseDays(userId, periodStart, asOf);
        long priorDays = transactionRepository.countDistinctExpenseDays(userId, previous[0], previous[1]);
        List<InsightsResponse.GroupChange> groupChanges = new ArrayList<>();
        for (KakeiboGroup group : KakeiboGroup.values()) {
            BigDecimal now = current.byGroup.get(group);
            BigDecimal before = prior.byGroup.get(group);
            groupChanges.add(new InsightsResponse.GroupChange(group, money(now), money(before),
                    percent(InsightCalculator.changePercent(now, before))));
        }
        InsightsResponse.Comparison comparison = new InsightsResponse.Comparison(
                periodStart.toString(), asOf.toString(), previous[0].toString(), previous[1].toString(),
                money(current.total), money(prior.total),
                percent(InsightCalculator.changePercent(current.total, prior.total)),
                currentDays, priorDays, groupChanges);

        LocalDate lookbackStart = InsightCalculator.lookbackStart(asOf);

        List<InsightsResponse.Observation> observations = new ArrayList<>();
        largestGroup(monthTotals, spendingDays).ifPresent(observations::add);
        observations.addAll(groupsOverPlan(userId, month, monthTotals));
        if (currentDays >= InsightCalculator.MIN_SPENDING_DAYS && priorDays >= InsightCalculator.MIN_SPENDING_DAYS) {
            observations.add(InsightsResponse.Observation.monthChange(money(current.total), money(prior.total),
                    percent(InsightCalculator.changePercent(current.total, prior.total))));
        }
        observations.addAll(repeatedCategories(userId, lookbackStart, asOf));

        return new InsightsResponse(
                month.toString(), periodStart.toString(), periodEnd.toString(), asOf.toString(), partial,
                InsightCalculator.MIN_SPENDING_DAYS, spendingDays,
                spendingDays < InsightCalculator.MIN_SPENDING_DAYS,
                money(monthTotals.total), groups, comparison,
                trend(userId, month, partial),
                lookbackStart.toString(), asOf.toString(), observations);
    }

    /** LARGEST_GROUP: at least 3 spending days, and one group strictly ahead (a tie names no group). */
    private static Optional<InsightsResponse.Observation> largestGroup(Totals totals, long spendingDays) {
        if (spendingDays < InsightCalculator.MIN_SPENDING_DAYS || totals.total.signum() == 0) {
            return Optional.empty();
        }
        KakeiboGroup top = null;
        boolean tie = false;
        for (KakeiboGroup group : KakeiboGroup.values()) {
            BigDecimal spent = totals.byGroup.get(group);
            if (top == null || spent.compareTo(totals.byGroup.get(top)) > 0) {
                top = group;
                tie = false;
            } else if (spent.compareTo(totals.byGroup.get(top)) == 0) {
                tie = true;
            }
        }
        if (tie) {
            return Optional.empty();
        }
        BigDecimal spent = totals.byGroup.get(top);
        return Optional.of(InsightsResponse.Observation.largestGroup(top, money(spent),
                percent(InsightCalculator.sharePercent(spent, totals.total)), spendingDays));
    }

    /** GROUP_OVER_PLAN: a plan exists, the group's budget is above zero and spending is above it. */
    private List<InsightsResponse.Observation> groupsOverPlan(UUID userId, YearMonth month, Totals totals) {
        List<InsightsResponse.Observation> result = new ArrayList<>();
        Optional<MonthlyBudget> budget = budgetService.findBudget(userId, month);
        if (budget.isEmpty()) {
            return result;
        }
        for (KakeiboGroup group : KakeiboGroup.values()) {
            BigDecimal allocation = budget.get().getAllocation(group);
            BigDecimal spent = totals.byGroup.get(group);
            if (allocation.signum() > 0 && spent.compareTo(allocation) > 0) {
                result.add(InsightsResponse.Observation.groupOverPlan(group, money(allocation), money(spent),
                        money(spent.subtract(allocation))));
            }
        }
        return result;
    }

    /**
     * REPEATED_CATEGORY: a category with expenses on at least 3 distinct days in the
     * lookback, reported as counts and dates only. Most days first, then most
     * expenses, then name.
     */
    private List<InsightsResponse.Observation> repeatedCategories(UUID userId, LocalDate from, LocalDate to) {
        Map<UUID, CategoryDays> byCategory = new LinkedHashMap<>();
        for (CategoryDayCount row : transactionRepository.countExpensesByCategoryAndDay(userId, from, to)) {
            CategoryDays days = byCategory.computeIfAbsent(row.categoryId(),
                    id -> new CategoryDays(row.categoryId(), row.categoryName(), row.group()));
            days.dates.add(row.date());
            days.count += row.count();
        }
        return byCategory.values().stream()
                .filter(days -> days.dates.size() >= InsightCalculator.MIN_SPENDING_DAYS)
                .sorted(Comparator.comparingInt((CategoryDays d) -> d.dates.size()).reversed()
                        .thenComparing(Comparator.comparingLong((CategoryDays d) -> d.count).reversed())
                        .thenComparing(d -> d.name))
                .map(days -> InsightsResponse.Observation.repeatedCategory(
                        days.id.toString(), days.name, days.group, days.dates.size(), days.count,
                        days.dates.stream().map(LocalDate::toString).toList()))
                .toList();
    }

    /** DEC-041: six calendar months ending with the selected month; no zero before the first transaction. */
    private List<InsightsResponse.TrendMonth> trend(UUID userId, YearMonth month, boolean partial) {
        YearMonth first = month.minusMonths(InsightCalculator.TREND_MONTHS - 1L);
        Map<String, BigDecimal> totals = new HashMap<>();
        for (MonthExpenseTotal row : transactionRepository.sumExpensesByMonth(
                userId, BudgetMonth.firstDay(first), BudgetMonth.lastDay(month))) {
            totals.put(row.getMonth(), row.getTotal());
        }
        LocalDate firstTransaction = transactionRepository.findFirstTransactionDate(userId);

        List<InsightsResponse.TrendMonth> result = new ArrayList<>();
        for (YearMonth m = first; !m.isAfter(month); m = m.plusMonths(1)) {
            boolean active = firstTransaction != null && !BudgetMonth.lastDay(m).isBefore(firstTransaction);
            String total = active ? money(totals.getOrDefault(m.toString(), BigDecimal.ZERO)) : null;
            result.add(new InsightsResponse.TrendMonth(m.toString(), total, active, partial && m.equals(month)));
        }
        return result;
    }

    private Totals expenseTotals(UUID userId, LocalDate from, LocalDate to) {
        Totals totals = new Totals();
        for (MonthlyTransactionTotal row : transactionRepository.aggregateByTypeAndGroup(userId, from, to)) {
            if (row.type() == TransactionType.EXPENSE && row.group() != null) {
                totals.byGroup.merge(row.group(), row.total(), BigDecimal::add);
                totals.counts.merge(row.group(), row.count(), Long::sum);
                totals.total = totals.total.add(row.total());
            }
        }
        return totals;
    }

    private static String money(BigDecimal value) {
        return BudgetCalculator.money(value).toPlainString();
    }

    private static String percent(BigDecimal value) {
        return value == null ? null : value.toPlainString();
    }

    private static final class Totals {
        private final Map<KakeiboGroup, BigDecimal> byGroup = new EnumMap<>(KakeiboGroup.class);
        private final Map<KakeiboGroup, Long> counts = new EnumMap<>(KakeiboGroup.class);
        private BigDecimal total = BigDecimal.ZERO;

        private Totals() {
            for (KakeiboGroup group : KakeiboGroup.values()) {
                byGroup.put(group, BigDecimal.ZERO);
                counts.put(group, 0L);
            }
        }
    }

    private static final class CategoryDays {
        private final UUID id;
        private final String name;
        private final KakeiboGroup group;
        private final TreeSet<LocalDate> dates = new TreeSet<>();
        private long count;

        private CategoryDays(UUID id, String name, KakeiboGroup group) {
            this.id = id;
            this.name = name;
            this.group = group;
        }
    }
}
