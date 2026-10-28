package com.divido.security;

import static org.assertj.core.api.Assertions.assertThat;

import com.divido.TestcontainersConfiguration;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.test.context.TestPropertySource;

/**
 * Spring Boot must not create its default "user" or log a generated password.
 * The unique property gives this class its own context, so startup happens while
 * output is being captured instead of being reused from the context cache.
 */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
@ExtendWith(OutputCaptureExtension.class)
@TestPropertySource(properties = "divido.test.context=default-user-startup")
class DefaultUserStartupIntegrationTest {

	@Autowired
	private ApplicationContext context;

	@Test
	void noDefaultUserIsCreated() {
		assertThat(context.getBeansOfType(InMemoryUserDetailsManager.class)).isEmpty();
		assertThat(context.getBean(UserDetailsService.class)).isNotInstanceOf(InMemoryUserDetailsManager.class);
	}

	@Test
	void startupDoesNotLogAGeneratedPassword(CapturedOutput output) {
		// Guard against a vacuous pass: the capture must contain this context's startup.
		assertThat(output.getAll()).contains(DefaultUserStartupIntegrationTest.class.getSimpleName());
		assertThat(output.getAll()).doesNotContainIgnoringCase("generated security password");
	}
}
