package com.divido.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record IncomeSourceCreateRequest(
        @NotBlank(message = "Income source name is required.")
        @Size(min = 1, max = 100, message = "Income source name must be between 1 and 100 characters.")
        String name
) {
}
