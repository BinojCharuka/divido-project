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
        String error
) {
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
                warning
        );
    }

    public List<String> safeWarnings() {
        return warnings != null ? warnings : List.of();
    }

    public String safeRawText() {
        return rawText != null ? rawText : "";
    }
}
