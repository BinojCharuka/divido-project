package com.divido.repository;

import com.divido.entity.MonthlyBudget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

public interface MonthlyBudgetRepository extends JpaRepository<MonthlyBudget, UUID> {

    Optional<MonthlyBudget> findByUserIdAndMonth(UUID userId, LocalDate month);

    /**
     * Creates or replaces the user's plan for one month in a single statement.
     * {@code ON CONFLICT} on the (user_id, budget_month) unique constraint makes
     * concurrent first saves safe: both succeed, the last write wins, and no
     * duplicate row or constraint error can occur.
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = """
            INSERT INTO monthly_budgets (user_id, budget_month, planned_income, savings_target,
                                         needs_allocation, wants_allocation, culture_allocation, unexpected_allocation)
            VALUES (:userId, :month, :plannedIncome, :savingsTarget, :needs, :wants, :culture, :unexpected)
            ON CONFLICT ON CONSTRAINT uq_monthly_budgets_user_month DO UPDATE SET
                planned_income = EXCLUDED.planned_income,
                savings_target = EXCLUDED.savings_target,
                needs_allocation = EXCLUDED.needs_allocation,
                wants_allocation = EXCLUDED.wants_allocation,
                culture_allocation = EXCLUDED.culture_allocation,
                unexpected_allocation = EXCLUDED.unexpected_allocation,
                updated_at = CURRENT_TIMESTAMP
            """, nativeQuery = true)
    void upsert(@Param("userId") UUID userId,
                @Param("month") LocalDate month,
                @Param("plannedIncome") BigDecimal plannedIncome,
                @Param("savingsTarget") BigDecimal savingsTarget,
                @Param("needs") BigDecimal needs,
                @Param("wants") BigDecimal wants,
                @Param("culture") BigDecimal culture,
                @Param("unexpected") BigDecimal unexpected);
}
