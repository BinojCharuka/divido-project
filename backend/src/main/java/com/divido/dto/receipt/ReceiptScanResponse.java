package com.divido.dto.receipt;

import com.divido.dto.TransactionCreateRequest;
import java.util.List;

public record ReceiptScanResponse(
        boolean success,
        ReceiptQuality receiptQuality,
        MerchantInfo merchant,
        TransactionInfo transaction,
        List<ReceiptItem> items,
        ExpenseClassification expense,
        ConfidenceScores confidence,
        String rawText,
        List<String> uncertainFields,
        TransactionCreateRequest mappedTransaction,
        String error
) {
    public ReceiptScanResponse(
            boolean success,
            ReceiptQuality receiptQuality,
            MerchantInfo merchant,
            TransactionInfo transaction,
            List<ReceiptItem> items,
            ExpenseClassification expense,
            ConfidenceScores confidence,
            String rawText,
            List<String> uncertainFields,
            TransactionCreateRequest mappedTransaction
    ) {
        this(success, receiptQuality, merchant, transaction, items, expense, confidence, rawText, uncertainFields, mappedTransaction, null);
    }

    public ReceiptScanResponse(
            boolean success,
            ReceiptQuality receiptQuality,
            MerchantInfo merchant,
            TransactionInfo transaction,
            List<ReceiptItem> items,
            ExpenseClassification expense,
            ConfidenceScores confidence,
            String rawText
    ) {
        this(success, receiptQuality, merchant, transaction, items, expense, confidence, rawText, List.of(), null, null);
    }

    public static ReceiptScanResponse failure(String warning) {
        return new ReceiptScanResponse(
                false,
                ReceiptQuality.withWarnings(false, false, List.of(warning)),
                null,
                null,
                List.of(),
                null,
                null,
                null,
                List.of(),
                null,
                warning
        );
    }

    public static ReceiptScanResponse unreadable(List<String> warnings, String rawText) {
        return new ReceiptScanResponse(
                false,
                ReceiptQuality.withWarnings(false, false, warnings),
                null,
                null,
                List.of(),
                null,
                null,
                rawText,
                List.of(),
                null,
                null
        );
    }
}
