package com.divido.service;

import com.divido.exception.FieldValidationException;

import java.time.Clock;
import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.regex.Pattern;

/**
 * DIV-017 month policy. A month is a calendar month written {@code YYYY-MM}. A
 * transaction belongs to the month of its stored date-only {@code transaction_date};
 * no timezone shifting is applied to it. Only "the current month" depends on a
 * timezone: the user's stored timezone, falling back to {@code Asia/Colombo}.
 */
public final class BudgetMonth {

    public static final ZoneId DEFAULT_ZONE = ZoneId.of("Asia/Colombo");

    // Years 1000-9999 only: PostgreSQL has no year 0 and YYYY must stay four digits.
    private static final Pattern FORMAT = Pattern.compile("^[1-9]\\d{3}-(0[1-9]|1[0-2])$");

    private BudgetMonth() {
    }

    public static YearMonth parse(String raw) {
        if (raw == null || !FORMAT.matcher(raw).matches()) {
            throw new FieldValidationException("month", "Month must be a valid month in the format YYYY-MM.");
        }
        return YearMonth.parse(raw);
    }

    public static LocalDate firstDay(YearMonth month) {
        return month.atDay(1);
    }

    /** Inclusive last day; handles 28/29/30/31-day months and leap years. */
    public static LocalDate lastDay(YearMonth month) {
        return month.atEndOfMonth();
    }

    public static YearMonth current(Clock clock, String timezone) {
        return YearMonth.now(clock.withZone(zoneOrDefault(timezone)));
    }

    static ZoneId zoneOrDefault(String timezone) {
        if (timezone == null || timezone.isBlank()) {
            return DEFAULT_ZONE;
        }
        try {
            return ZoneId.of(timezone);
        } catch (DateTimeException ex) {
            return DEFAULT_ZONE;
        }
    }
}
