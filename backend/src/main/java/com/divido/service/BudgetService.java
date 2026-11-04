package com.divido.service;

import com.divido.dto.MonthlyBudgetRequest;
import com.divido.dto.MonthlyBudgetResponse;
import com.divido.entity.KakeiboGroup;
import com.divido.entity.MonthlyBudget;
import com.divido.exception.BudgetNotFoundException;
import com.divido.exception.ValidationErrorsException;
import com.divido.repository.MonthlyBudgetRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Monthly budget plans (DIV-025). Every read and write is scoped to the user id taken
 * from the authenticated session by the controller.
 */
@Service
@Transactional
public class BudgetService {

    /** Same ceiling as transaction amounts and the NUMERIC(12,2) column. */
    static final BigDecimal MAX_AMOUNT = new BigDecimal("9999999999.99");
    private static final Pattern AMOUNT_FORMAT = Pattern.compile("^\\d{1,15}(\\.\\d{1,2})?$");

    private final MonthlyBudgetRepository budgetRepository;

    public BudgetService(MonthlyBudgetRepository budgetRepository) {
        this.budgetRepository = budgetRepository;
    }

    @Transactional(readOnly = true)
    public MonthlyBudgetResponse getBudget(UUID userId, String rawMonth) {
        YearMonth month = BudgetMonth.parse(rawMonth);
        MonthlyBudget budget = findBudget(userId, month).orElseThrow(BudgetNotFoundException::new);
        return toResponse(budget);
    }

    public MonthlyBudgetResponse saveBudget(UUID userId, String rawMonth, MonthlyBudgetRequest request) {
        YearMonth month = BudgetMonth.parse(rawMonth);
        if (request == null) {
            throw new ValidationErrorsException(Map.of("plannedIncome", "Planned income is required."));
        }

        Map<String, String> errors = new LinkedHashMap<>();
        BigDecimal plannedIncome = parseAmount(request.plannedIncome(), "plannedIncome", "Planned income", errors);
        BigDecimal savingsTarget = parseAmount(request.savingsTarget(), "savingsTarget", "Savings target", errors);
        Map<KakeiboGroup, BigDecimal> allocations = parseAllocations(request.allocations(), errors);
        if (!errors.isEmpty()) {
            throw new ValidationErrorsException(errors);
        }

        LocalDate firstDay = BudgetMonth.firstDay(month);
        budgetRepository.upsert(userId, firstDay, plannedIncome, savingsTarget,
                allocations.get(KakeiboGroup.NEEDS),
                allocations.get(KakeiboGroup.WANTS),
                allocations.get(KakeiboGroup.CULTURE),
                allocations.get(KakeiboGroup.UNEXPECTED));

        MonthlyBudget saved = budgetRepository.findByUserIdAndMonth(userId, firstDay)
                .orElseThrow(() -> new IllegalStateException("Budget upsert did not persist a row."));
        return toResponse(saved);
    }

    /** Used by the dashboard so both APIs read plans the same way. */
    @Transactional(readOnly = true)
    public Optional<MonthlyBudget> findBudget(UUID userId, YearMonth month) {
        return budgetRepository.findByUserIdAndMonth(userId, BudgetMonth.firstDay(month));
    }

    public static BudgetCalculator.PlanFigures figures(MonthlyBudget budget) {
        Map<KakeiboGroup, BigDecimal> allocations = new EnumMap<>(KakeiboGroup.class);
        for (KakeiboGroup group : KakeiboGroup.values()) {
            allocations.put(group, budget.getAllocation(group));
        }
        return BudgetCalculator.plan(budget.getPlannedIncome(), budget.getSavingsTarget(), allocations);
    }

    private static MonthlyBudgetResponse toResponse(MonthlyBudget budget) {
        return MonthlyBudgetResponse.from(budget, figures(budget));
    }

    private static Map<KakeiboGroup, BigDecimal> parseAllocations(Map<String, String> raw, Map<String, String> errors) {
        Map<KakeiboGroup, BigDecimal> result = new EnumMap<>(KakeiboGroup.class);
        if (raw == null) {
            errors.put("allocations", "Allocations for NEEDS, WANTS, CULTURE and UNEXPECTED are required.");
            return result;
        }
        for (String key : raw.keySet()) {
            if (!isGroupName(key)) {
                errors.putIfAbsent("allocations",
                        "Allocations may only contain NEEDS, WANTS, CULTURE and UNEXPECTED.");
            }
        }
        for (KakeiboGroup group : KakeiboGroup.values()) {
            String field = "allocations." + group.name();
            BigDecimal value = parseAmount(raw.get(group.name()), field, label(group) + " allocation", errors);
            if (value != null) {
                result.put(group, value);
            }
        }
        return result;
    }

    private static boolean isGroupName(String key) {
        for (KakeiboGroup group : KakeiboGroup.values()) {
            if (group.name().equals(key)) {
                return true;
            }
        }
        return false;
    }

    private static String label(KakeiboGroup group) {
        return switch (group) {
            case NEEDS -> "Needs";
            case WANTS -> "Wants";
            case CULTURE -> "Culture";
            case UNEXPECTED -> "Unexpected";
        };
    }

    /**
     * DIV-017: required, zero or more, at most two decimal places, at most
     * 9,999,999,999.99. Returns {@code null} and records an error when invalid.
     */
    static BigDecimal parseAmount(String raw, String field, String label, Map<String, String> errors) {
        if (raw == null || raw.isBlank()) {
            errors.put(field, label + " is required.");
            return null;
        }
        String trimmed = raw.trim();
        if (trimmed.startsWith("-")) {
            errors.put(field, label + " cannot be negative.");
            return null;
        }
        if (!AMOUNT_FORMAT.matcher(trimmed).matches()) {
            errors.put(field, label + " must be a number with at most 2 decimal places.");
            return null;
        }
        BigDecimal value = new BigDecimal(trimmed);
        if (value.compareTo(MAX_AMOUNT) > 0) {
            errors.put(field, label + " exceeds the maximum allowed amount.");
            return null;
        }
        return value.setScale(BudgetCalculator.MONEY_SCALE, RoundingMode.UNNECESSARY);
    }
}
