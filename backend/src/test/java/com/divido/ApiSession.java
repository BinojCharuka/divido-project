package com.divido;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.assertj.MockMvcTester;
import org.springframework.test.web.servlet.assertj.MockMvcTester.MockMvcRequestBuilder;
import org.springframework.test.web.servlet.assertj.MvcTestResult;

/**
 * Signed-in request helpers for the Phase 03 integration tests: the same register,
 * sign-in and CSRF flow the browser uses. {@code session} may be null (anonymous).
 */
public final class ApiSession {

	public static final String PASSWORD = "correct-horse-battery";

	private ApiSession() {
	}

	public static MockHttpSession registerAndLogin(MockMvcTester mvc, String email) {
		var reg = write(mvc, mvc.post().uri("/api/v1/auth/register"),
				"{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\",\"displayName\":\"User\"}", null);
		assertThat(reg).hasStatus(HttpStatus.CREATED);
		var login = write(mvc, mvc.post().uri("/api/v1/auth/login"),
				"{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\"}", null);
		assertThat(login).hasStatus(HttpStatus.OK);
		return (MockHttpSession) login.getRequest().getSession(false);
	}

	public static MvcTestResult get(MockMvcTester mvc, String uri, MockHttpSession session) {
		return withSession(mvc.get().uri(uri), session).exchange();
	}

	public static MvcTestResult post(MockMvcTester mvc, String uri, String json, MockHttpSession session) {
		return write(mvc, mvc.post().uri(uri), json, session);
	}

	public static MvcTestResult put(MockMvcTester mvc, String uri, String json, MockHttpSession session) {
		return write(mvc, mvc.put().uri(uri), json, session);
	}

	public static MvcTestResult delete(MockMvcTester mvc, String uri, MockHttpSession session) {
		return write(mvc, mvc.delete().uri(uri), null, session);
	}

	/** A state-changing request with a valid CSRF token. */
	public static MvcTestResult write(MockMvcTester mvc, MockMvcRequestBuilder request, String json,
			MockHttpSession session) {
		var withCsrf = CsrfSupport.fetch(mvc).apply(request);
		withSession(withCsrf, session);
		if (json != null) {
			withCsrf.contentType(MediaType.APPLICATION_JSON).content(json);
		}
		return withCsrf.exchange();
	}

	public static MockMvcRequestBuilder withSession(MockMvcRequestBuilder request, MockHttpSession session) {
		if (session != null) {
			request.session(session).with(r -> {
				r.setRequestedSessionId(session.getId());
				r.setRequestedSessionIdValid(true);
				return r;
			});
		}
		return request;
	}

	public static String body(MvcTestResult result) {
		return new String(result.getResponse().getContentAsByteArray(), StandardCharsets.UTF_8);
	}
}
