package com.divido;

import static org.assertj.core.api.Assertions.assertThat;

import com.jayway.jsonpath.JsonPath;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Optional;

/**
 * Minimal browser stand-in for tests against the embedded server. Cookies are
 * handled by hand so every Set-Cookie header can be inspected.
 */
public final class RealServerClient {

	private final HttpClient http = HttpClient.newHttpClient();
	private final int port;
	private final String sessionCookie;
	private final String csrfCookie;

	public RealServerClient(int port, String sessionCookie, String csrfCookie) {
		this.port = port;
		this.sessionCookie = sessionCookie;
		this.csrfCookie = csrfCookie;
	}

	/** A masked token from the body plus the raw value from the CSRF cookie. */
	public record Csrf(String token, String cookieValue) {
	}

	public Csrf csrf() throws Exception {
		var response = get("/api/v1/auth/csrf", null);
		assertThat(response.statusCode()).isEqualTo(200);
		return new Csrf(JsonPath.read(response.body(), "$.token"),
				value(setCookie(response, csrfCookie).orElseThrow()));
	}

	public HttpResponse<String> get(String path, String session) throws Exception {
		var request = HttpRequest.newBuilder(uri(path)).GET();
		if (session != null) {
			request.header("Cookie", sessionCookie + "=" + session);
		}
		return http.send(request.build(), HttpResponse.BodyHandlers.ofString());
	}

	public HttpResponse<String> postWithCsrf(String path, String json, String session) throws Exception {
		Csrf csrf = csrf();
		String cookies = csrfCookie + "=" + csrf.cookieValue() + (session == null ? "" : "; " + sessionCookie + "=" + session);
		var request = HttpRequest.newBuilder(uri(path)).header("Cookie", cookies).header("X-XSRF-TOKEN", csrf.token())
				.header("Content-Type", "application/json")
				.POST(json == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(json))
				.build();
		return http.send(request, HttpResponse.BodyHandlers.ofString());
	}

	public HttpResponse<String> register(String email, String password) throws Exception {
		return postWithCsrf("/api/v1/auth/register",
				"{\"email\":\"%s\",\"password\":\"%s\",\"displayName\":\"Cookie Test\"}".formatted(email, password), null);
	}

	public HttpResponse<String> login(String email, String password, String session) throws Exception {
		return postWithCsrf("/api/v1/auth/login", "{\"email\":\"%s\",\"password\":\"%s\"}".formatted(email, password),
				session);
	}

	public static Optional<String> setCookie(HttpResponse<?> response, String name) {
		return response.headers().allValues("Set-Cookie").stream().filter(c -> c.startsWith(name + "=")).findFirst();
	}

	public static String value(String setCookie) {
		String pair = setCookie.split(";", 2)[0];
		return pair.substring(pair.indexOf('=') + 1);
	}

	private URI uri(String path) {
		return URI.create("http://localhost:" + port + path);
	}
}
