package com.divido.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;

/**
 * DEC-041 and DEC-032 rules for Spending Insights (DIV-027), kept in one place so
 * they can be unit tested without a database.
 */
public final class InsightCalculator {

    /** DEC-011 / DEC-031: minimum distinct spending days before an observation is shown. */
    public static final int MIN_SPENDING_DAYS = 3;
    /** DEC-032: lookback length in calendar days, inclusive of both ends. */
    public static final int LOOKBACK_DAYS = 90;
    /** DEC-041: number of calendar months in the trend, ending with the selected month. */
    public static final int TREND_MONTHS = 6;

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private InsightCalculator() {
    }

    /** {@code part / total * 100}, 1 decimal place, HALF_UP; {@code null} when total is zero. */
    public static BigDecimal sharePercent(BigDecimal part, BigDecimal total) {
        if (total.signum() == 0) {
            return null;
        }
        return part.multiply(HUNDRED).divide(total, 1, RoundingMode.HALF_UP);
    }

    /** {@code (current - previous) / previous * 100}, 1 decimal place, HALF_UP; {@code null} when previous is zero. */
    public static BigDecimal changePercent(BigDecimal current, BigDecimal previous) {
        if (previous.signum() == 0) {
            return null;
        }
        return current.subtract(previous).multiply(HUNDRED).divide(previous, 1, RoundingMode.HALF_UP);
    }

    /** DEC-032: the earlier of today and the selected month's last day. */
    public static LocalDate asOf(YearMonth month, LocalDate today) {
        LocalDate last = month.atEndOfMonth();
        return today.isBefore(last) ? today : last;
    }

    /** DEC-032: 90 calendar days inclusive, ending on {@code asOf}. */
    public static LocalDate lookbackStart(LocalDate asOf) {
        return asOf.minusDays(LOOKBACK_DAYS - 1L);
    }

    /**
     * DEC-041: the previous-month range to compare with. A partial (current) month
     * compares day 1 to the same day number of the previous month, clamped to that
     * month's length; a complete month compares with the whole previous month.
     */
    public static LocalDate[] previousRange(YearMonth month, LocalDate asOf) {
        YearMonth previous = month.minusMonths(1);
        boolean partial = asOf.isBefore(month.atEndOfMonth());
        LocalDate end = partial
                ? previous.atDay(Math.min(asOf.getDayOfMonth(), previous.lengthOfMonth()))
                : previous.atEndOfMonth();
        return new LocalDate[]{previous.atDay(1), end};
    }
}
