package com.divido.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.divido.TestcontainersConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

/**
 * Baseline for the current SecurityConfig (HTTP Basic, stateless). This documents
 * existing behavior only; it is not the approved session/CSRF design.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class SecurityBaselineIntegrationTest {

	@Autowired
	private MockMvcTester mvc;

	@Test
	void actuatorDiscoveryRequiresAuthentication() {
		// /actuator exists (endpoint discovery) but is not in the permitAll list.
		var result = mvc.get().uri("/actuator").exchange();

		assertThat(result).hasStatus(HttpStatus.UNAUTHORIZED);
		assertThat(result).headers().hasHeaderSatisfying(HttpHeaders.WWW_AUTHENTICATE,
				values -> assertThat(values).anySatisfy(value -> assertThat(value).startsWith("Basic")));
	}

}
