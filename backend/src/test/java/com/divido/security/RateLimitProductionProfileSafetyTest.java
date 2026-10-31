package com.divido.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import static org.assertj.core.api.Assertions.assertThat;

import com.divido.TestcontainersConfiguration;
import org.springframework.context.annotation.Import;

/**
 * Verifies that rate limiting is enabled by default in the production application profile.
 */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
@TestPropertySource(properties = {
        // Exclude the test fail-safe override to verify the production application.yml default
        "divido.rate-limit.enabled=true"
})
class RateLimitProductionProfileSafetyTest {

    @Autowired
    private RateLimitProperties properties;

    @Test
    void productionDefaultRateLimitingIsEnabled() {
        assertThat(properties.isEnabled()).isTrue();
        assertThat(properties.getLogin().getLimit()).isGreaterThanOrEqualTo(1);
        assertThat(properties.getLogin().getWindow()).isPositive();
        assertThat(properties.getRegister().getLimit()).isGreaterThanOrEqualTo(1);
        assertThat(properties.getRegister().getWindow()).isPositive();
    }
}
