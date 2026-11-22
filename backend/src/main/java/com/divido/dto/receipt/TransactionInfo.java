package com.divido.dto.receipt;

import java.math.BigDecimal;
import java.time.LocalDate;

public record TransactionInfo(
        LocalDate date,
        String time,
        String currency,
        BigDecimal subtotal,
        BigDecimal discount,
        BigDecimal tax,
        BigDecimal serviceCharge,
        BigDecimal total,
        BigDecimal amountPaid,
        BigDecimal change
) {}

