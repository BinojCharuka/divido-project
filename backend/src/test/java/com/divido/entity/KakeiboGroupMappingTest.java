package com.divido.entity;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class KakeiboGroupMappingTest {

    private final KakeiboGroupConverter converter = new KakeiboGroupConverter();

    @Test
    void mapsApiGroupToDbColumnValue() {
        assertThat(KakeiboGroup.NEEDS.getDbValue()).isEqualTo("NEED");
        assertThat(KakeiboGroup.WANTS.getDbValue()).isEqualTo("WANT");
        assertThat(KakeiboGroup.CULTURE.getDbValue()).isEqualTo("CULTURE");
        assertThat(KakeiboGroup.UNEXPECTED.getDbValue()).isEqualTo("UNEXPECTED");
    }

    @Test
    void mapsDbColumnValueToApiGroup() {
        assertThat(KakeiboGroup.fromDbValue("NEED")).isEqualTo(KakeiboGroup.NEEDS);
        assertThat(KakeiboGroup.fromDbValue("WANT")).isEqualTo(KakeiboGroup.WANTS);
        assertThat(KakeiboGroup.fromDbValue("CULTURE")).isEqualTo(KakeiboGroup.CULTURE);
        assertThat(KakeiboGroup.fromDbValue("UNEXPECTED")).isEqualTo(KakeiboGroup.UNEXPECTED);

        // Also handles case-insensitivity and plural if passed
        assertThat(KakeiboGroup.fromDbValue("need")).isEqualTo(KakeiboGroup.NEEDS);
        assertThat(KakeiboGroup.fromDbValue("NEEDS")).isEqualTo(KakeiboGroup.NEEDS);
    }

    @Test
    void converterConvertsBidirectionally() {
        assertThat(converter.convertToDatabaseColumn(KakeiboGroup.NEEDS)).isEqualTo("NEED");
        assertThat(converter.convertToDatabaseColumn(KakeiboGroup.WANTS)).isEqualTo("WANT");
        assertThat(converter.convertToDatabaseColumn(null)).isNull();

        assertThat(converter.convertToEntityAttribute("NEED")).isEqualTo(KakeiboGroup.NEEDS);
        assertThat(converter.convertToEntityAttribute("WANT")).isEqualTo(KakeiboGroup.WANTS);
        assertThat(converter.convertToEntityAttribute(null)).isNull();
    }

    @Test
    void unknownValueThrowsException() {
        assertThatThrownBy(() -> KakeiboGroup.fromDbValue("INVALID"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unknown database category_type");
    }
}
