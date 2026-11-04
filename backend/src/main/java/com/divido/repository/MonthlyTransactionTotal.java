package com.divido.repository;

import com.divido.entity.KakeiboGroup;
import com.divido.entity.TransactionType;

import java.math.BigDecimal;

/**
 * One aggregate row for a user and date range: the total and count of transactions
 * of one type, and for expenses one Kakeibo group. {@code group} is null for income.
 */
public record MonthlyTransactionTotal(TransactionType type, KakeiboGroup group, BigDecimal total, long count) {
}
