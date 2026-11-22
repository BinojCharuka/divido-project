package com.divido.dto.receipt;

import java.util.List;

public record ReceiptScanResponse(
        boolean success,
        ReceiptQuality receiptQuality,
        MerchantInfo merchant,
        TransactionInfo transaction,
        List<ReceiptItem> items,
        ExpenseClassification expense,
        ConfidenceScores confidence,
        String rawText
) {
    public static ReceiptScanResponse failure(String warning) {
        return new ReceiptScanResponse(
                false,
                ReceiptQuality.withWarnings(false, false, List.of(warning)),
                null,
                null,
                List.of(),
                null,
                null,
                null
        );
    }
}

