package com.divido.dto.receipt;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

public record ReceiptQuality(
        @JsonProperty("isReadable") boolean isReadable,
        @JsonProperty("isBlurry") boolean isBlurry,
        List<String> warnings
) {
    public static ReceiptQuality clean() {
        return new ReceiptQuality(true, false, List.of());
    }

    public static ReceiptQuality withWarnings(boolean readable, boolean blurry, List<String> warnings) {
        return new ReceiptQuality(readable, blurry, warnings != null ? warnings : List.of());
    }
}

