package com.divido.dto.receipt;

import java.math.BigDecimal;

public record ReceiptItem(
        String name,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal totalPrice
) {}

