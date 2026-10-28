package com.divido.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.boot.web.server.servlet.ConfigurableServletWebServerFactory;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.Locale;
import java.util.Set;

/**
 * Names and attributes of the session and CSRF cookies, validated at startup.
 * Secure deployments use {@code __Host-} names, which browsers accept only with
 * Secure, Path=/ and no Domain. Local HTTP ({@code secure: false}) uses the same
 * names without the prefix. The session cookie name is applied to the embedded
 * server here, so it must not also be set as a property.
 */
@Component
public class CookieSettings implements WebServerFactoryCustomizer<ConfigurableServletWebServerFactory> {

    public static final String HOST_PREFIX = "__Host-";
    static final String SESSION_COOKIE = "DIVIDO_SESSION";
    static final String CSRF_COOKIE = "XSRF-TOKEN";

    private static final Set<String> SAME_SITE_VALUES = Set.of("Lax", "Strict", "None");

    private final boolean secure;
    private final String sameSite;

    public CookieSettings(
            @Value("${server.servlet.session.cookie.secure}") boolean secure,
            @Value("${server.servlet.session.cookie.same-site}") String sameSite,
            @Value("${server.servlet.session.cookie.path:/}") String path,
            @Value("${server.servlet.session.cookie.domain:}") String domain,
            @Value("${server.servlet.session.cookie.name:}") String name) {
        if (StringUtils.hasText(name)) {
            throw new IllegalStateException("Do not set server.servlet.session.cookie.name; the session cookie "
                    + "name is derived from server.servlet.session.cookie.secure");
        }
        if (StringUtils.hasText(domain)) {
            throw new IllegalStateException("server.servlet.session.cookie.domain must not be set: "
                    + "__Host- cookies cannot have a Domain attribute");
        }
        if (!"/".equals(path)) {
            throw new IllegalStateException("server.servlet.session.cookie.path must be /");
        }
        this.secure = secure;
        this.sameSite = StringUtils.capitalize(sameSite.strip().toLowerCase(Locale.ROOT));
        if (!SAME_SITE_VALUES.contains(this.sameSite)) {
            throw new IllegalStateException("server.servlet.session.cookie.same-site must be lax, strict or none");
        }
        if ("None".equals(this.sameSite) && !secure) {
            throw new IllegalStateException("SameSite=None cookies must also be Secure");
        }
    }

    public boolean secure() {
        return secure;
    }

    /** {@code Lax}, {@code Strict} or {@code None}. */
    public String sameSite() {
        return sameSite;
    }

    public String sessionCookieName() {
        return secure ? HOST_PREFIX + SESSION_COOKIE : SESSION_COOKIE;
    }

    public String csrfCookieName() {
        return secure ? HOST_PREFIX + CSRF_COOKIE : CSRF_COOKIE;
    }

    @Override
    public void customize(ConfigurableServletWebServerFactory factory) {
        factory.getSettings().getSession().getCookie().setName(sessionCookieName());
    }
}
