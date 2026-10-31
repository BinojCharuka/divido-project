package com.divido.dto;

import com.divido.entity.IncomeSource;

import java.util.UUID;

public record IncomeSourceRefResponse(
        UUID id,
        String name
) {
    public static IncomeSourceRefResponse fromEntity(IncomeSource source) {
        if (source == null) {
            return null;
        }
        return new IncomeSourceRefResponse(
                source.getId(),
                source.getName()
        );
    }
}
