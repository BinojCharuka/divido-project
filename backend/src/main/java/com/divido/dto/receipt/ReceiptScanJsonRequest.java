package com.divido.dto.receipt;

public record ReceiptScanJsonRequest(
        String image,
        String mimeType
) {}

