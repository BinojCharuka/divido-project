package com.divido.dto;

import com.divido.entity.KakeiboGroup;
import jakarta.validation.constraints.Size;

public record CategoryUpdateRequest(
        @Size(min = 1, max = 100, message = "Category name must be between 1 and 100 characters.")
        String name,

        KakeiboGroup group
) {
}
