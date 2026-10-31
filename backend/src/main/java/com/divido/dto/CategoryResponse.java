package com.divido.dto;

import com.divido.entity.Category;
import com.divido.entity.KakeiboGroup;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.UUID;

public record CategoryResponse(
        UUID id,
        String name,
        KakeiboGroup group,
        @JsonProperty("isDefault") boolean isDefault,
        boolean active
) {
    public static CategoryResponse fromEntity(Category category) {
        return new CategoryResponse(
                category.getId(),
                category.getName(),
                category.getGroup(),
                category.isDefault(),
                category.isActive()
        );
    }
}
