package com.divido.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

class CategorySlugTest {

    @ParameterizedTest
    @CsvSource({
            "'Groceries', 'groceries'",
            "'Dining Out', 'dining-out'",
            "'Pet  Care & Food', 'pet-care-food'",
            "'  Books & Learning! ', 'books-learning'",
            "'Special-Chars---Here', 'special-chars-here'",
            "'100% Organic', '100-organic'",
            "'Café & Crêpes', 'cafe-crepes'",
            "'', ''",
            "'---', ''"
    })
    void slugifyConvertsToCleanKebabCase(String input, String expected) {
        assertThat(CategoryService.slugify(input)).isEqualTo(expected);
    }

    @Test
    void slugifyHandlesNullGracefully() {
        assertThat(CategoryService.slugify(null)).isEqualTo("");
    }
}
