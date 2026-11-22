package com.divido.dto.receipt;

import java.util.List;

public record OcrResult(
        boolean success,
        boolean isReadable,
        Double confidence,
        String rawText,
        List<String> lines,
        String languagesUsed,
        boolean hasMonetaryValues,
        boolean hasLikelyTotalLabel,
        List<String> warnings,
        String error,
        String errorCode
) {
    public OcrResult(
            boolean success,
            boolean isReadable,
            Double confidence,
            String rawText,
            List<String> lines,
            String languagesUsed,
            boolean hasMonetaryValues,
            boolean hasLikelyTotalLabel,
            List<String> warnings,
            String error
    ) {
        this(success, isReadable, confidence, rawText, lines, languagesUsed, hasMonetaryValues, hasLikelyTotalLabel, warnings, error, null);
    }

    public static OcrResult systemError(String errorCode, String message) {
        return new OcrResult(
                false,
                false,
                0.0,
                "",
                List.of(),
                "eng",
                false,
                false,
                List.of(message),
                message,
                errorCode
        );
    }

    public static OcrResult failed(String warning) {
        return new OcrResult(
                false,
                false,
                0.0,
                "",
                List.of(),
                "eng",
                false,
                false,
                List.of(warning),
                warning,
                "OCR_FAILED"
        );
    }

    public List<String> safeWarnings() {
        return warnings != null ? warnings : List.of();
    }

    public String safeRawText() {
        return rawText != null ? rawText : "";
    }
}
