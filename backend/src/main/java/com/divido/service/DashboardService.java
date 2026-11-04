package com.divido.service;

import com.divido.dto.DashboardResponse;
import com.divido.entity.AppUser;
import com.divido.entity.KakeiboGroup;
import com.divido.entity.MonthlyBudget;
import com.divido.entity.TransactionType;
import com.divido.repository.AppUserRepository;
import com.divido.repository.MonthlyTransactionTotal;
import com.divido.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Monthly dashboard (DIV-026): the month's plan beside the recorded totals. All
 * formulas come from {@link BudgetCalculator}; all totals from one aggregate query.
 */
@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final BudgetService budgetService;
    private final TransactionRepository transactionRepository;
    private final AppUserRepository userRepository;
    private final Clock clock;

    public DashboardService(BudgetService budgetService,
                            TransactionRepository transactionRepository,
                            AppUserRepository userRepository,
                            Clock clock) {
        this.budgetService = budgetService;
        this.transactionRepository = transactionRepository;
        this.userRepository = userRepository;
        this.clock = clock;
    }

    public DashboardResponse getDashboard(UUID userId, String rawMonth) {
        YearMonth month = rawMonth == null || rawMonth.isEmpty()
                ? BudgetMonth.current(clock, userRepository.findById(userId).map(AppUser::getTimezone).orElse(null))
                : BudgetMonth.parse(rawMonth);
        LocalDate from = BudgetMonth.firstDay(month);
        LocalDate to = BudgetMonth.lastDay(month);

        BigDecimal recordedIncome = BigDecimal.ZERO;
        long incomeCount = 0;
        Map<KakeiboGroup, BigDecimal> spent = new EnumMap<>(KakeiboGroup.class);
        Map<KakeiboGroup, Long> expenseCounts = new EnumMap<>(KakeiboGroup.class);
        for (KakeiboGroup group : KakeiboGroup.values()) {
            spent.put(group, BigDecimal.ZERO);
            expenseCounts.put(group, 0L);
        }

        for (MonthlyTransactionTotal row : transactionRepository.aggregateByTypeAndGroup(userId, from, to)) {
            if (row.type() == TransactionType.INCOME) {
                recordedIncome = recordedIncome.add(row.total());
                incomeCount += row.count();
            } else if (row.type() == TransactionType.EXPENSE && row.group() != null) {
                // The V3 CHECK guarantees every expense has a category, so group is never null here.
                spent.merge(row.group(), row.total(), BigDecimal::add);
                expenseCounts.merge(row.group(), row.count(), Long::sum);
            }
        }

        BigDecimal totalSpent = BigDecimal.ZERO;
        long expenseCount = 0;
        for (KakeiboGroup group : KakeiboGroup.values()) {
            totalSpent = totalSpent.add(spent.get(group));
            expenseCount += expenseCounts.get(group);
        }

        Optional<MonthlyBudget> budget = budgetService.findBudget(userId, month);
        BudgetCalculator.PlanFigures figures = budget.map(BudgetService::figures).orElse(null);

        List<DashboardResponse.Group> groups = new ArrayList<>();
        for (KakeiboGroup group : KakeiboGroup.values()) {
            BigDecimal groupSpent = spent.get(group);
            if (budget.isPresent()) {
                BigDecimal allocation = budget.get().getAllocation(group);
                BigDecimal remaining = BudgetCalculator.remaining(allocation, groupSpent);
                BigDecimal percent = BudgetCalculator.percentUsed(allocation, groupSpent);
                groups.add(new DashboardResponse.Group(
                        group,
                        BudgetCalculator.money(allocation).toPlainString(),
                        BudgetCalculator.money(groupSpent).toPlainString(),
                        remaining.toPlainString(),
                        percent == null ? null : percent.toPlainString(),
                        remaining.signum() < 0,
                        expenseCounts.get(group)));
            } else {
                groups.add(new DashboardResponse.Group(
                        group, null, BudgetCalculator.money(groupSpent).toPlainString(),
                        null, null, null, expenseCounts.get(group)));
            }
        }

        return new DashboardResponse(
                month.toString(),
                from.toString(),
                to.toString(),
                budget.isPresent(),
                budget.map(b -> BudgetCalculator.money(b.getPlannedIncome()).toPlainString()).orElse(null),
                budget.map(b -> BudgetCalculator.money(b.getSavingsTarget()).toPlainString()).orElse(null),
                figures == null ? null : figures.allocationTotal().toPlainString(),
                figures == null ? null : figures.plannedTotal().toPlainString(),
                figures == null ? null : figures.overAllocationAmount().toPlainString(),
                figures == null ? null : figures.overAllocated(),
                BudgetCalculator.money(recordedIncome).toPlainString(),
                incomeCount,
                BudgetCalculator.money(totalSpent).toPlainString(),
                expenseCount,
                groups);
    }
}
