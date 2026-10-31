package com.divido.dto;

import jakarta.validation.constraints.Size;

public record IncomeSourceUpdateRequest(
        @Size(min = 1, max = 100, message = "Income source name must be between 1 and 100 characters.")
        String name
) {
}
