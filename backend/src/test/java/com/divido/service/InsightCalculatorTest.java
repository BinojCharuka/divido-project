package com.divido.service;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;

import static org.assertj.core.api.Assertions.assertThat;

/** DEC-032 and DEC-041 rules, each value written out by hand. */
class InsightCalculatorTest {

    @Test
    void sharePercentRoundsHalfUpToOneDecimal() {
        assertThat(InsightCalculator.sharePercent(new BigDecimal("1.00"), new BigDecimal("3.00"))).isEqualByComparingTo("33.3");
        assertThat(InsightCalculator.sharePercent(new BigDecimal("2.00"), new BigDecimal("3.00"))).isEqualByComparingTo("66.7");
        assertThat(InsightCalculator.sharePercent(new BigDecimal("1.00"), new BigDecimal("8.00"))).hasToString("12.5");
        assertThat(InsightCalculator.sharePercent(new BigDecimal("0.01"), new BigDecimal("16.00"))).hasToString("0.1");
    }

    @Test
    void percentagesAreNullWhenTheBaseIsZero() {
        assertThat(InsightCalculator.sharePercent(BigDecimal.ZERO, BigDecimal.ZERO)).isNull();
        assertThat(InsightCalculator.changePercent(new BigDecimal("10.00"), BigDecimal.ZERO)).isNull();
    }

    @Test
    void changePercentIsSignedAndRounded() {
        assertThat(InsightCalculator.changePercent(new BigDecimal("150.00"), new BigDecimal("100.00"))).hasToString("50.0");
        assertThat(InsightCalculator.changePercent(new BigDecimal("50.00"), new BigDecimal("100.00"))).hasToString("-50.0");
        assertThat(InsightCalculator.changePercent(new BigDecimal("100.00"), new BigDecimal("100.00"))).hasToString("0.0");
        assertThat(InsightCalculator.changePercent(new BigDecimal("100.00"), new BigDecimal("300.00"))).hasToString("-66.7");
    }

    @Test
    void asOfIsTheEarlierOfTodayAndMonthEnd() {
        LocalDate today = LocalDate.of(2026, 11, 16);
        assertThat(InsightCalculator.asOf(YearMonth.of(2026, 11), today)).isEqualTo(today);
        assertThat(InsightCalculator.asOf(YearMonth.of(2026, 10), today)).isEqualTo(LocalDate.of(2026, 10, 31));
    }

    @Test
    void lookbackIsNinetyDaysInclusive() {
        LocalDate asOf = LocalDate.of(2026, 11, 16);
        LocalDate start = InsightCalculator.lookbackStart(asOf);
        assertThat(start).isEqualTo(LocalDate.of(2026, 8, 19));
        assertThat(java.time.temporal.ChronoUnit.DAYS.between(start, asOf) + 1).isEqualTo(90);
    }

    @Test
    void partialMonthComparesTheSameDayRangeClampedToThePreviousMonth() {
        LocalDate[] range = InsightCalculator.previousRange(YearMonth.of(2026, 3), LocalDate.of(2026, 3, 30));
        assertThat(range[0]).isEqualTo(LocalDate.of(2026, 2, 1));
        assertThat(range[1]).isEqualTo(LocalDate.of(2026, 2, 28));

        range = InsightCalculator.previousRange(YearMonth.of(2028, 3), LocalDate.of(2028, 3, 30));
        assertThat(range[1]).isEqualTo(LocalDate.of(2028, 2, 29)); // leap year

        range = InsightCalculator.previousRange(YearMonth.of(2026, 11), LocalDate.of(2026, 11, 16));
        assertThat(range[0]).isEqualTo(LocalDate.of(2026, 10, 1));
        assertThat(range[1]).isEqualTo(LocalDate.of(2026, 10, 16));
    }

    @Test
    void completeMonthComparesTheWholePreviousMonth() {
        LocalDate[] range = InsightCalculator.previousRange(YearMonth.of(2026, 2), LocalDate.of(2026, 2, 28));
        assertThat(range[0]).isEqualTo(LocalDate.of(2026, 1, 1));
        assertThat(range[1]).isEqualTo(LocalDate.of(2026, 1, 31));

        range = InsightCalculator.previousRange(YearMonth.of(2026, 1), LocalDate.of(2026, 1, 31));
        assertThat(range[0]).isEqualTo(LocalDate.of(2025, 12, 1));
        assertThat(range[1]).isEqualTo(LocalDate.of(2025, 12, 31));
    }
}
