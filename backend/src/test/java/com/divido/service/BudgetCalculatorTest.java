package com.divido.service;

import com.divido.entity.KakeiboGroup;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.EnumMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** DIV-017 formulas. Expected values are written out by hand, never computed by the code under test. */
class BudgetCalculatorTest {

    private static Map<KakeiboGroup, BigDecimal> allocations(String needs, String wants, String culture, String unexpected) {
        Map<KakeiboGroup, BigDecimal> map = new EnumMap<>(KakeiboGroup.class);
        map.put(KakeiboGroup.NEEDS, new BigDecimal(needs));
        map.put(KakeiboGroup.WANTS, new BigDecimal(wants));
        map.put(KakeiboGroup.CULTURE, new BigDecimal(culture));
        map.put(KakeiboGroup.UNEXPECTED, new BigDecimal(unexpected));
        return map;
    }

    @Test
    void referencePlanFitsExactly() {
        var f = BudgetCalculator.plan(new BigDecimal("100000.00"), new BigDecimal("15000.00"),
                allocations("40000.00", "20000.00", "10000.00", "5000.00"));
        assertThat(f.allocationTotal()).isEqualByComparingTo("75000.00");
        assertThat(f.plannedTotal()).isEqualByComparingTo("90000.00");
        // 90,000 planned against 100,000 income: 10,000 not yet planned
        assertThat(f.overAllocationAmount().toPlainString()).isEqualTo("-10000.00");
        assertThat(f.overAllocated()).isFalse();
    }

    @Test
    void exactMatchIsNotOverAllocated() {
        var f = BudgetCalculator.plan(new BigDecimal("90000.00"), new BigDecimal("15000.00"),
                allocations("40000.00", "20000.00", "10000.00", "5000.00"));
        assertThat(f.overAllocationAmount().toPlainString()).isEqualTo("0.00");
        assertThat(f.overAllocated()).isFalse();
    }

    @Test
    void planAboveIncomeIsOverAllocated() {
        var f = BudgetCalculator.plan(new BigDecimal("80000.00"), new BigDecimal("15000.00"),
                allocations("40000.00", "20000.00", "10000.00", "5000.00"));
        assertThat(f.overAllocationAmount().toPlainString()).isEqualTo("10000.00");
        assertThat(f.overAllocated()).isTrue();
    }

    @Test
    void oneCentOverIsOverAllocated() {
        var f = BudgetCalculator.plan(new BigDecimal("100.00"), new BigDecimal("0.01"),
                allocations("100.00", "0", "0", "0"));
        assertThat(f.overAllocationAmount().toPlainString()).isEqualTo("0.01");
        assertThat(f.overAllocated()).isTrue();
    }

    @Test
    void centsAddUpExactlyWithoutFloatingPointDrift() {
        // 0.10 + 0.20 is 0.30000000000000004 in binary floating point
        var f = BudgetCalculator.plan(new BigDecimal("0.30"), new BigDecimal("0.00"),
                allocations("0.10", "0.20", "0.00", "0.00"));
        assertThat(f.allocationTotal().toPlainString()).isEqualTo("0.30");
        assertThat(f.overAllocationAmount().toPlainString()).isEqualTo("0.00");
        assertThat(f.overAllocated()).isFalse();
    }

    @Test
    void allZeroPlanIsValid() {
        var f = BudgetCalculator.plan(BigDecimal.ZERO, BigDecimal.ZERO, allocations("0", "0", "0", "0"));
        assertThat(f.allocationTotal().toPlainString()).isEqualTo("0.00");
        assertThat(f.plannedTotal().toPlainString()).isEqualTo("0.00");
        assertThat(f.overAllocationAmount().toPlainString()).isEqualTo("0.00");
        assertThat(f.overAllocated()).isFalse();
    }

    @Test
    void maximumValuesDoNotOverflow() {
        var f = BudgetCalculator.plan(new BigDecimal("9999999999.99"), new BigDecimal("9999999999.99"),
                allocations("9999999999.99", "9999999999.99", "9999999999.99", "9999999999.99"));
        assertThat(f.allocationTotal().toPlainString()).isEqualTo("39999999999.96");
        assertThat(f.plannedTotal().toPlainString()).isEqualTo("49999999999.95");
        assertThat(f.overAllocationAmount().toPlainString()).isEqualTo("39999999999.96");
    }

    @Test
    void missingAllocationIsRejected() {
        Map<KakeiboGroup, BigDecimal> partial = new EnumMap<>(KakeiboGroup.class);
        partial.put(KakeiboGroup.NEEDS, BigDecimal.ONE);
        assertThatThrownBy(() -> BudgetCalculator.plan(BigDecimal.TEN, BigDecimal.ZERO, partial))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void remainingMayBeNegativeAndIsNotClamped() {
        assertThat(BudgetCalculator.remaining(new BigDecimal("5000.00"), new BigDecimal("6250.50")).toPlainString())
                .isEqualTo("-1250.50");
        assertThat(BudgetCalculator.remaining(new BigDecimal("5000.00"), new BigDecimal("5000.00")).toPlainString())
                .isEqualTo("0.00");
        assertThat(BudgetCalculator.remaining(new BigDecimal("0.00"), new BigDecimal("10.00")).toPlainString())
                .isEqualTo("-10.00");
    }

    @Test
    void percentUsedIsUndefinedForZeroBudget() {
        assertThat(BudgetCalculator.percentUsed(new BigDecimal("0.00"), new BigDecimal("10.00"))).isNull();
        assertThat(BudgetCalculator.percentUsed(new BigDecimal("0.00"), new BigDecimal("0.00"))).isNull();
    }

    @Test
    void percentUsedRoundsHalfUpToOneDecimal() {
        assertThat(BudgetCalculator.percentUsed(new BigDecimal("40000.00"), new BigDecimal("22000.00")).toPlainString())
                .isEqualTo("55.0");
        // 1/3 = 33.333... -> 33.3 ; 2/3 = 66.666... -> 66.7 ; 1/8 = 12.5 exactly
        assertThat(BudgetCalculator.percentUsed(new BigDecimal("3.00"), new BigDecimal("1.00")).toPlainString())
                .isEqualTo("33.3");
        assertThat(BudgetCalculator.percentUsed(new BigDecimal("3.00"), new BigDecimal("2.00")).toPlainString())
                .isEqualTo("66.7");
        // 0.0005 of the budget rounds half up: 1/2000 = 0.05 -> 0.1
        assertThat(BudgetCalculator.percentUsed(new BigDecimal("2000.00"), new BigDecimal("1.00")).toPlainString())
                .isEqualTo("0.1");
        assertThat(BudgetCalculator.percentUsed(new BigDecimal("5000.00"), new BigDecimal("6250.00")).toPlainString())
                .isEqualTo("125.0");
        assertThat(BudgetCalculator.percentUsed(new BigDecimal("5000.00"), new BigDecimal("0.00")).toPlainString())
                .isEqualTo("0.0");
    }
}
