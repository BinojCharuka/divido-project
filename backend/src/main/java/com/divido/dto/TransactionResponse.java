package com.divido.dto;

import com.divido.entity.Transaction;
import com.divido.entity.TransactionType;

import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record TransactionResponse(
        UUID id,
        TransactionType type,
        String amount,
        LocalDate date,
        TransactionCategoryResponse category,
        IncomeSourceRefResponse incomeSource,
        String description,
        String paymentMethod,
        Instant createdAt,
        Instant updatedAt
) {
    public static TransactionResponse fromEntity(Transaction tx) {
        String formattedAmount = tx.getAmount() != null
                ? tx.getAmount().setScale(2, RoundingMode.HALF_UP).toPlainString()
                : null;
        return new TransactionResponse(
                tx.getId(),
                tx.getType(),
                formattedAmount,
                tx.getDate(),
                TransactionCategoryResponse.fromEntity(tx.getCategory()),
                IncomeSourceRefResponse.fromEntity(tx.getIncomeSource()),
                tx.getDescription(),
                tx.getPaymentMethod(),
                tx.getCreatedAt(),
                tx.getUpdatedAt()
        );
    }
}
