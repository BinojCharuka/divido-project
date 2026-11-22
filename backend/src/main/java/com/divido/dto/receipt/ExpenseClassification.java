package com.divido.dto.receipt;

import java.util.UUID;

public record ExpenseClassification(
        String purpose,
        String suggestedCategory,
        UUID matchedCategoryId
) {}

