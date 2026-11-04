package com.divido.service;

import com.divido.exception.FieldValidationException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/** DIV-017 month and timezone policy. */
class BudgetMonthTest {

    @Test
    void parsesValidMonths() {
        assertThat(BudgetMonth.parse("2026-10")).isEqualTo(YearMonth.of(2026, 10));
        assertThat(BudgetMonth.parse("2026-01")).isEqualTo(YearMonth.of(2026, 1));
        assertThat(BudgetMonth.parse("2026-12")).isEqualTo(YearMonth.of(2026, 12));
    }

    @ParameterizedTest
    @ValueSource(strings = {"", "2026", "2026-1", "2026-13", "2026-00", "26-10", "2026/10", "2026-10-01",
            "0000-01", "abcd-ef", " 2026-10", "2026-10 ", "+2026-10", "12026-10"})
    void rejectsMalformedMonths(String raw) {
        assertThatThrownBy(() -> BudgetMonth.parse(raw))
                .isInstanceOf(FieldValidationException.class)
                .extracting("field").isEqualTo("month");
    }

    @Test
    void rejectsNullMonth() {
        assertThatThrownBy(() -> BudgetMonth.parse(null)).isInstanceOf(FieldValidationException.class);
    }

    @Test
    void monthBoundariesAreInclusiveCalendarDays() {
        assertThat(BudgetMonth.firstDay(YearMonth.of(2026, 10))).isEqualTo(LocalDate.of(2026, 10, 1));
        assertThat(BudgetMonth.lastDay(YearMonth.of(2026, 10))).isEqualTo(LocalDate.of(2026, 10, 31));
        assertThat(BudgetMonth.lastDay(YearMonth.of(2026, 11))).isEqualTo(LocalDate.of(2026, 11, 30));
        assertThat(BudgetMonth.lastDay(YearMonth.of(2026, 12))).isEqualTo(LocalDate.of(2026, 12, 31));
        assertThat(BudgetMonth.firstDay(YearMonth.of(2027, 1))).isEqualTo(LocalDate.of(2027, 1, 1));
    }

    @Test
    void februaryFollowsLeapYearRules() {
        assertThat(BudgetMonth.lastDay(YearMonth.of(2026, 2))).isEqualTo(LocalDate.of(2026, 2, 28));
        assertThat(BudgetMonth.lastDay(YearMonth.of(2028, 2))).isEqualTo(LocalDate.of(2028, 2, 29));
        assertThat(BudgetMonth.lastDay(YearMonth.of(2100, 2))).isEqualTo(LocalDate.of(2100, 2, 28));
        assertThat(BudgetMonth.lastDay(YearMonth.of(2000, 2))).isEqualTo(LocalDate.of(2000, 2, 29));
    }

    @Test
    void currentMonthUsesColomboTimeNotUtc() {
        // Asia/Colombo is UTC+05:30. 18:29:59Z on Oct 31 is 23:59:59 on Oct 31 in Colombo.
        Clock beforeMidnight = Clock.fixed(Instant.parse("2026-10-31T18:29:59Z"), ZoneOffset.UTC);
        assertThat(BudgetMonth.current(beforeMidnight, "Asia/Colombo")).isEqualTo(YearMonth.of(2026, 10));
        // 18:30:00Z is 00:00 on Nov 1 in Colombo, while UTC is still Oct 31.
        Clock atMidnight = Clock.fixed(Instant.parse("2026-10-31T18:30:00Z"), ZoneOffset.UTC);
        assertThat(BudgetMonth.current(atMidnight, "Asia/Colombo")).isEqualTo(YearMonth.of(2026, 11));
    }

    @Test
    void currentMonthCrossesTheYearBoundaryInColombo() {
        Clock newYear = Clock.fixed(Instant.parse("2026-12-31T18:30:00Z"), ZoneOffset.UTC);
        assertThat(BudgetMonth.current(newYear, "Asia/Colombo")).isEqualTo(YearMonth.of(2027, 1));
        Clock lastMinute = Clock.fixed(Instant.parse("2026-12-31T18:29:00Z"), ZoneOffset.UTC);
        assertThat(BudgetMonth.current(lastMinute, "Asia/Colombo")).isEqualTo(YearMonth.of(2026, 12));
    }

    @Test
    void missingOrInvalidTimezoneFallsBackToColombo() {
        Clock atMidnight = Clock.fixed(Instant.parse("2026-10-31T18:30:00Z"), ZoneOffset.UTC);
        assertThat(BudgetMonth.current(atMidnight, null)).isEqualTo(YearMonth.of(2026, 11));
        assertThat(BudgetMonth.current(atMidnight, "")).isEqualTo(YearMonth.of(2026, 11));
        assertThat(BudgetMonth.current(atMidnight, "Not/AZone")).isEqualTo(YearMonth.of(2026, 11));
    }
}
