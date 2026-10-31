package com.divido.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = true)
public class KakeiboGroupConverter implements AttributeConverter<KakeiboGroup, String> {

    @Override
    public String convertToDatabaseColumn(KakeiboGroup attribute) {
        return attribute != null ? attribute.getDbValue() : null;
    }

    @Override
    public KakeiboGroup convertToEntityAttribute(String dbData) {
        return KakeiboGroup.fromDbValue(dbData);
    }
}
