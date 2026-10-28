package com.divido;

import static org.assertj.core.api.Assertions.assertThat;

import com.jayway.jsonpath.JsonPath;
import jakarta.servlet.http.Cookie;
import java.nio.charset.StandardCharsets;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MockMvcTester.MockMvcRequestBuilder;

/**
 * Obtains a CSRF token the way the frontend will: GET /api/v1/auth/csrf, keep the
 * masked token from the body, and send it in X-XSRF-TOKEN. The browser returns the
 * HttpOnly CSRF cookie automatically; MockMvc needs it added by hand.
 *
 * @param token the masked token from the response body
 * @param cookieValue the raw token held in the CSRF cookie, never seen by the client
 */
public record CsrfSupport(String headerName, String token, String cookieValue) {

	/** Default (secure) configuration; local HTTP drops the __Host- prefix. */
	public static final String COOKIE_NAME = "__Host-XSRF-TOKEN";

	public static CsrfSupport fetch(MockMvcTester mvc) {
		var result = mvc.get().uri("/api/v1/auth/csrf").exchange();
		assertThat(result).hasStatus(HttpStatus.OK);
		String body = new String(result.getResponse().getContentAsByteArray(), StandardCharsets.UTF_8);
		Cookie cookie = result.getResponse().getCookie(COOKIE_NAME);
		assertThat(cookie).isNotNull();
		return new CsrfSupport(JsonPath.read(body, "$.headerName"), JsonPath.read(body, "$.token"), cookie.getValue());
	}

	public MockMvcRequestBuilder apply(MockMvcRequestBuilder request) {
		return request.header(headerName, token).cookie(cookie());
	}

	public Cookie cookie() {
		return new Cookie(COOKIE_NAME, cookieValue);
	}
}
