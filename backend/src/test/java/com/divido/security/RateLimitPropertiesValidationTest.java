package com.divido.security;

import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RateLimitPropertiesValidationTest {

    @Test
    void defaultConfigurationIsValid() {
        RateLimitProperties props = new RateLimitProperties();
        props.validate();
        assertThat(props.isEnabled()).isTrue();
        assertThat(props.getLogin().getLimit()).isEqualTo(10);
        assertThat(props.getLogin().getWindow()).isEqualTo(Duration.ofMinutes(1));
        assertThat(props.getRegister().getLimit()).isEqualTo(10);
        assertThat(props.getRegister().getWindow()).isEqualTo(Duration.ofMinutes(1));
    }

    @Test
    void zeroOrNegativeLoginLimitFailsStartup() {
        RateLimitProperties props = new RateLimitProperties();
        props.getLogin().setLimit(0);
        assertThatThrownBy(props::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("divido.rate-limit.login.limit must be at least 1");

        props.getLogin().setLimit(-5);
        assertThatThrownBy(props::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("divido.rate-limit.login.limit must be at least 1");
    }

    @Test
    void zeroOrNegativeRegisterLimitFailsStartup() {
        RateLimitProperties props = new RateLimitProperties();
        props.getRegister().setLimit(0);
        assertThatThrownBy(props::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("divido.rate-limit.register.limit must be at least 1");
    }

    @Test
    void nullOrNegativeWindowFailsStartup() {
        RateLimitProperties props = new RateLimitProperties();
        props.getLogin().setWindow(null);
        assertThatThrownBy(props::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("divido.rate-limit.login.window must not be null");

        props.getLogin().setWindow(Duration.ZERO);
        assertThatThrownBy(props::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("divido.rate-limit.login.window must be strictly positive");

        props.getLogin().setWindow(Duration.ofSeconds(-10));
        assertThatThrownBy(props::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("divido.rate-limit.login.window must be strictly positive");
    }

    @Test
    void nullPolicyFailsStartup() {
        RateLimitProperties props = new RateLimitProperties();
        props.setLogin(null);
        assertThatThrownBy(props::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("divido.rate-limit.login policy must not be null");

        RateLimitProperties props2 = new RateLimitProperties();
        props2.setRegister(null);
        assertThatThrownBy(props2::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("divido.rate-limit.register policy must not be null");
    }

    @Test
    void validCustomConfigurationSucceeds() {
        RateLimitProperties props = new RateLimitProperties();
        props.setLogin(new RateLimitProperties.Policy(5, Duration.ofSeconds(30)));
        props.setRegister(new RateLimitProperties.Policy(2, Duration.ofMinutes(5)));
        props.validate();

        assertThat(props.getLogin().getLimit()).isEqualTo(5);
        assertThat(props.getLogin().getWindow()).isEqualTo(Duration.ofSeconds(30));
        assertThat(props.getRegister().getLimit()).isEqualTo(2);
        assertThat(props.getRegister().getWindow()).isEqualTo(Duration.ofMinutes(5));
    }
}
