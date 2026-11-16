package com.divido.repository;

import java.math.BigDecimal;

/** Native-query projection: total expenses for one calendar month written {@code YYYY-MM}. */
public interface MonthExpenseTotal {

    String getMonth();

    BigDecimal getTotal();
}
