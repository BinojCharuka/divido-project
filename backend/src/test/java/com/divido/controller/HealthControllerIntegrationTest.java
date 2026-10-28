package com.divido.controller;

import static org.assertj.core.api.Assertions.assertThat;

import com.divido.TestcontainersConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.assertj.MockMvcTester;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class HealthControllerIntegrationTest {

	@Autowired
	private MockMvcTester mvc;

	@Test
	void healthIsPublicAndReportsUp() {
		var result = mvc.get().uri("/api/v1/health").exchange();

		assertThat(result).hasStatus(HttpStatus.OK);
		assertThat(result).hasContentTypeCompatibleWith(MediaType.APPLICATION_JSON);
		assertThat(result).bodyJson().extractingPath("$.status").isEqualTo("UP");
	}

}
