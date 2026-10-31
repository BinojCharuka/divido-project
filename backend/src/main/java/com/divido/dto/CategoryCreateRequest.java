package com.divido.dto;

import com.divido.entity.KakeiboGroup;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CategoryCreateRequest(
        @NotBlank(message = "Category name is required.")
        @Size(min = 1, max = 100, message = "Category name must be between 1 and 100 characters.")
        String name,

        @NotNull(message = "Category group is required.")
        KakeiboGroup group
) {
}
