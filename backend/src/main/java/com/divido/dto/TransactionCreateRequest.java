package com.divido.dto;

import com.divido.entity.TransactionType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record TransactionCreateRequest(
        @NotNull(message = "Transaction type is required.")
        TransactionType type,

        @NotNull(message = "Amount is required.")
        String amount,

        @NotNull(message = "Date is required.")
        LocalDate date,

        UUID categoryId,

        UUID incomeSourceId,

        @Size(max = 500, message = "Description must not exceed 500 characters.")
        String description,

        @Size(max = 50, message = "Payment method must not exceed 50 characters.")
        String paymentMethod
) {
}
