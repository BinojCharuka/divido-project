package com.divido.dto;

import com.divido.entity.Category;
import com.divido.entity.KakeiboGroup;

import java.util.UUID;

public record TransactionCategoryResponse(
        UUID id,
        String name,
        KakeiboGroup group
) {
    public static TransactionCategoryResponse fromEntity(Category category) {
        if (category == null) {
            return null;
        }
        return new TransactionCategoryResponse(
                category.getId(),
                category.getName(),
                category.getGroup()
        );
    }
}
