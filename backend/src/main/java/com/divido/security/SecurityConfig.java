package com.divido.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.logout.CompositeLogoutHandler;
import org.springframework.security.web.authentication.logout.LogoutHandler;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.authentication.session.ChangeSessionIdAuthenticationStrategy;
import org.springframework.security.web.authentication.session.CompositeSessionAuthenticationStrategy;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.context.DelegatingSecurityContextRepository;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.RequestAttributeSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfAuthenticationStrategy;
import org.springframework.security.web.csrf.CsrfLogoutHandler;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.security.web.savedrequest.NullRequestCache;
import org.springframework.util.StringUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.net.URI;
import java.time.Duration;
import java.util.List;
import java.util.regex.Pattern;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import tools.jackson.databind.json.JsonMapper;
import java.time.Clock;

import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Session-cookie authentication with cookie-based CSRF protection. The session is
 * created only by a successful login; anonymous requests never create one.
 * Cookie names and attributes come from {@link CookieSettings}.
 */
@Configuration
@EnableScheduling
@EnableConfigurationProperties(RateLimitProperties.class)
public class SecurityConfig {

    public static final String CSRF_HEADER_NAME = "X-XSRF-TOKEN";

    /** scheme://host[:port], nothing else: no path, query, user info or wildcard. */
    private static final Pattern ORIGIN = Pattern.compile("https?://[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?(:[0-9]{1,5})?");

    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }

    @Bean
    public SlidingWindowRateLimiter slidingWindowRateLimiter() {
        return new SlidingWindowRateLimiter();
    }

    @Bean
    public RateLimitingFilter rateLimitingFilter(SlidingWindowRateLimiter rateLimiter,
            RateLimitProperties properties, JsonMapper jsonMapper, Clock clock) {
        return new RateLimitingFilter(rateLimiter, properties, jsonMapper, clock);
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, CsrfTokenRepository csrfTokenRepository,
            SecurityContextRepository securityContextRepository, ApiSecurityErrorHandler errorHandler,
            RateLimitingFilter rateLimitingFilter)
            throws Exception {

        http
            .addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/health", "/actuator/health", "/error").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/auth/csrf").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/auth/register", "/api/v1/auth/login").permitAll()
                .anyRequest().authenticated()
            )
            .csrf(csrf -> csrf
                .csrfTokenRepository(csrfTokenRepository)
                // XOR-masked tokens, accepted only from the X-XSRF-TOKEN header.
                .csrfTokenRequestHandler(new HeaderOnlyXorCsrfTokenRequestHandler())
            )
            .cors(Customizer.withDefaults())
            .securityContext(context -> context.securityContextRepository(securityContextRepository))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
            // A saved request would create a session for every anonymous 401.
            .requestCache(cache -> cache.requestCache(new NullRequestCache()))
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint(errorHandler)
                .accessDeniedHandler(errorHandler)
            )
            .httpBasic(AbstractHttpConfigurer::disable)
            .formLogin(AbstractHttpConfigurer::disable)
            // Logout is POST /api/v1/auth/logout in AuthController, so it requires a session.
            .logout(AbstractHttpConfigurer::disable);

        return http.build();
    }

    /**
     * Login, logout and /me. Defining these beans also stops Spring Boot creating
     * its default "user" and logging a generated password.
     */
    @Bean
    public AuthenticationManager authenticationManager(UserDetailsService userDetailsService,
            PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return new ProviderManager(provider);
    }

    /** Delegating encoder: stores {@code {bcrypt}...} hashes and can upgrade algorithms later. */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new DelegatingSecurityContextRepository(
                new RequestAttributeSecurityContextRepository(), new HttpSessionSecurityContextRepository());
    }

    /**
     * Holds the raw token in an HttpOnly cookie. Clients never read it; they send the
     * masked token from GET /api/v1/auth/csrf, which the server unmasks and compares.
     */
    @Bean
    public CsrfTokenRepository csrfTokenRepository(CookieSettings cookies) {
        CookieCsrfTokenRepository repository = new CookieCsrfTokenRepository();
        repository.setCookieName(cookies.csrfCookieName());
        repository.setHeaderName(CSRF_HEADER_NAME);
        repository.setCookiePath("/");
        repository.setCookieCustomizer(cookie -> cookie.secure(cookies.secure()).sameSite(cookies.sameSite()));
        return repository;
    }

    /** Applied by LoginService: a new session ID and a new CSRF token after sign-in. */
    @Bean
    public SessionAuthenticationStrategy sessionAuthenticationStrategy(CsrfTokenRepository csrfTokenRepository) {
        CsrfAuthenticationStrategy csrf = new CsrfAuthenticationStrategy(csrfTokenRepository);
        csrf.setRequestHandler(new HeaderOnlyXorCsrfTokenRequestHandler());
        return new CompositeSessionAuthenticationStrategy(List.of(new ChangeSessionIdAuthenticationStrategy(), csrf));
    }

    /** Invalidates the session, clears the CSRF cookie and expires the session cookie. */
    @Bean
    public LogoutHandler logoutHandler(SecurityContextRepository securityContextRepository,
            CsrfTokenRepository csrfTokenRepository, CookieSettings cookies) {
        SecurityContextLogoutHandler context = new SecurityContextLogoutHandler();
        context.setSecurityContextRepository(securityContextRepository);
        LogoutHandler expireSessionCookie = (request, response, authentication) -> response.addHeader(
                HttpHeaders.SET_COOKIE, ResponseCookie.from(cookies.sessionCookieName(), "")
                        .path("/")
                        .maxAge(0)
                        .httpOnly(true)
                        .secure(cookies.secure())
                        .sameSite(cookies.sameSite())
                        .build()
                        .toString());
        return new CompositeLogoutHandler(context, new CsrfLogoutHandler(csrfTokenRepository), expireSessionCookie);
    }

    /**
     * Credentialed CORS for an exact list of frontend origins. With no origins
     * configured, no cross-origin request is allowed.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource(
            @Value("${divido.cors.allowed-origins:}") List<String> allowedOrigins) {
        List<String> origins = validatedOrigins(allowedOrigins);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        if (origins.isEmpty()) {
            return source;
        }
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE"));
        config.setAllowedHeaders(List.of(HttpHeaders.CONTENT_TYPE, CSRF_HEADER_NAME));
        config.setAllowCredentials(true);
        config.setMaxAge(Duration.ofHours(1));
        source.registerCorsConfiguration("/api/**", config);
        return source;
    }

    /**
     * Rejects anything but exact http(s) origins at startup, including {@code null},
     * wildcards, missing schemes, paths and trailing slashes.
     */
    static List<String> validatedOrigins(List<String> configured) {
        List<String> origins = configured.stream().map(String::strip).filter(StringUtils::hasText).toList();
        for (String origin : origins) {
            if (!ORIGIN.matcher(origin).matches() || URI.create(origin).getPort() > 65535) {
                throw new IllegalStateException("divido.cors.allowed-origins entries must be exact origins such as "
                        + "https://app.example.com; rejected: " + origin);
            }
        }
        return origins;
    }
}
