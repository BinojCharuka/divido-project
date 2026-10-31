package com.divido.security;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.PropertySource;
import org.springframework.core.io.ClassPathResource;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies that rate limiting is enabled by default in the production application.yml
 * without inheriting test-only overrides (such as config/application.properties)
 * or relying on vacuous @TestPropertySource injections.
 */
class RateLimitProductionProfileSafetyTest {

    @Configuration(proxyBeanMethods = false)
    @EnableConfigurationProperties(RateLimitProperties.class)
    static class TestConfig {
    }

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
            .withInitializer(context -> {
                try {
                    YamlPropertySourceLoader loader = new YamlPropertySourceLoader();
                    List<PropertySource<?>> sources = loader.load(
                            "application.yml",
                            new ClassPathResource("application.yml")
                    );
                    for (PropertySource<?> source : sources) {
                        context.getEnvironment().getPropertySources().addLast(source);
                    }
                } catch (IOException e) {
                    throw new UncheckedIOException(e);
                }
            })
            .withUserConfiguration(TestConfig.class);

    @Test
    void productionDefaultRateLimitingIsEnabled() {
        contextRunner.run(context -> {
            assertThat(context).hasNotFailed();

            RateLimitProperties properties = context.getBean(RateLimitProperties.class);
            assertThat(properties.isEnabled())
                    .as("Production default application.yml must have divido.rate-limit.enabled=true")
                    .isTrue();

            assertThat(properties.getLogin()).isNotNull();
            assertThat(properties.getLogin().getLimit()).isGreaterThanOrEqualTo(1);
            assertThat(properties.getLogin().getWindow()).isPositive();

            assertThat(properties.getRegister()).isNotNull();
            assertThat(properties.getRegister().getLimit()).isGreaterThanOrEqualTo(1);
            assertThat(properties.getRegister().getWindow()).isPositive();
        });
    }
}

