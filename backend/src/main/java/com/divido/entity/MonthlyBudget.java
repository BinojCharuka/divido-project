package com.divido.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Maps {@code monthly_budgets} from Flyway V4 (DIV-025). Rows are written only by
 * the atomic upsert in {@link com.divido.repository.MonthlyBudgetRepository}, so this
 * entity is read-only from the application's point of view.
 */
@Entity
@Table(name = "monthly_budgets")
public class MonthlyBudget {

    @Id
    private UUID id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    /** First day of the calendar month. */
    @Column(name = "budget_month", nullable = false, updatable = false)
    private LocalDate month;

    @Column(name = "planned_income", nullable = false, precision = 12, scale = 2)
    private BigDecimal plannedIncome;

    @Column(name = "savings_target", nullable = false, precision = 12, scale = 2)
    private BigDecimal savingsTarget;

    @Column(name = "needs_allocation", nullable = false, precision = 12, scale = 2)
    private BigDecimal needsAllocation;

    @Column(name = "wants_allocation", nullable = false, precision = 12, scale = 2)
    private BigDecimal wantsAllocation;

    @Column(name = "culture_allocation", nullable = false, precision = 12, scale = 2)
    private BigDecimal cultureAllocation;

    @Column(name = "unexpected_allocation", nullable = false, precision = 12, scale = 2)
    private BigDecimal unexpectedAllocation;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected MonthlyBudget() {
    }

    public UUID getId() {
        return id;
    }

    public UUID getUserId() {
        return userId;
    }

    public LocalDate getMonth() {
        return month;
    }

    public BigDecimal getPlannedIncome() {
        return plannedIncome;
    }

    public BigDecimal getSavingsTarget() {
        return savingsTarget;
    }

    public BigDecimal getAllocation(KakeiboGroup group) {
        return switch (group) {
            case NEEDS -> needsAllocation;
            case WANTS -> wantsAllocation;
            case CULTURE -> cultureAllocation;
            case UNEXPECTED -> unexpectedAllocation;
        };
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
