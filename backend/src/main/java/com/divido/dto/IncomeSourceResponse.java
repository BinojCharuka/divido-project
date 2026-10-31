package com.divido.dto;

import com.divido.entity.IncomeSource;

import java.util.UUID;

public record IncomeSourceResponse(
        UUID id,
        String name,
        boolean active
) {
    public static IncomeSourceResponse fromEntity(IncomeSource source) {
        return new IncomeSourceResponse(source.getId(), source.getName(), source.isActive());
    }
}
