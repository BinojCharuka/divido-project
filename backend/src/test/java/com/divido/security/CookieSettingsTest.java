package com.divido.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

/** Cookie names follow the secure flag, and incompatible settings stop startup. */
class CookieSettingsTest {

	@Test
	void secureCookiesUseTheHostPrefix() {
		CookieSettings cookies = new CookieSettings(true, "lax", "/", "", "");

		assertThat(cookies.sessionCookieName()).isEqualTo("__Host-DIVIDO_SESSION");
		assertThat(cookies.csrfCookieName()).isEqualTo("__Host-XSRF-TOKEN");
		assertThat(cookies.sameSite()).isEqualTo("Lax");
	}

	@Test
	void localHttpUsesUnprefixedNames() {
		CookieSettings cookies = new CookieSettings(false, "lax", "/", "", "");

		assertThat(cookies.sessionCookieName()).isEqualTo("DIVIDO_SESSION");
		assertThat(cookies.csrfCookieName()).isEqualTo("XSRF-TOKEN");
	}

	@Test
	void anExplicitSessionCookieNameIsRefused() {
		assertThatThrownBy(() -> new CookieSettings(true, "lax", "/", "", "__Host-DIVIDO_SESSION"))
				.isInstanceOf(IllegalStateException.class);
		assertThatThrownBy(() -> new CookieSettings(false, "lax", "/", "", "JSESSIONID"))
				.isInstanceOf(IllegalStateException.class);
	}

	@Test
	void aCookieDomainIsRefused() {
		assertThatThrownBy(() -> new CookieSettings(true, "lax", "/", "example.com", ""))
				.isInstanceOf(IllegalStateException.class);
	}

	@Test
	void aPathOtherThanRootIsRefused() {
		assertThatThrownBy(() -> new CookieSettings(true, "lax", "/api", "", ""))
				.isInstanceOf(IllegalStateException.class);
	}

	@Test
	void sameSiteNoneRequiresSecure() {
		assertThat(new CookieSettings(true, "none", "/", "", "").sameSite()).isEqualTo("None");
		assertThatThrownBy(() -> new CookieSettings(false, "none", "/", "", ""))
				.isInstanceOf(IllegalStateException.class);
	}

	@Test
	void unknownSameSiteValuesAreRefused() {
		assertThatThrownBy(() -> new CookieSettings(true, "loose", "/", "", ""))
				.isInstanceOf(IllegalStateException.class);
	}

	@Test
	void invalidSettingsStopTheApplicationContext() {
		new ApplicationContextRunner().withUserConfiguration(CookieSettings.class)
				.withPropertyValues("server.servlet.session.cookie.secure=true",
						"server.servlet.session.cookie.same-site=lax", "server.servlet.session.cookie.domain=example.com")
				.run(context -> assertThat(context).hasFailed());
		new ApplicationContextRunner().withUserConfiguration(CookieSettings.class)
				.withPropertyValues("server.servlet.session.cookie.secure=true",
						"server.servlet.session.cookie.same-site=lax")
				.run(context -> assertThat(context).hasNotFailed());
	}
}
