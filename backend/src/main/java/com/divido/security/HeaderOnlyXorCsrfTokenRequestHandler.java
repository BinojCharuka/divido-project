package com.divido.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRequestHandler;
import org.springframework.security.web.csrf.XorCsrfTokenRequestAttributeHandler;

import java.util.function.Supplier;

/**
 * Spring Security's XOR-masked CSRF handling, but the token is read only from the
 * request header. The standard handlers fall back to a {@code _csrf} request
 * parameter, which a cross-site HTML form can send without any custom header.
 */
public final class HeaderOnlyXorCsrfTokenRequestHandler implements CsrfTokenRequestHandler {

    private final XorCsrfTokenRequestAttributeHandler delegate = new XorCsrfTokenRequestAttributeHandler();

    /** Exposes a freshly masked token as the request attribute (and CsrfToken argument). */
    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response, Supplier<CsrfToken> csrfToken) {
        delegate.handle(request, response, csrfToken);
    }

    /** Unmasks the header value; returns null (rejected) when there is no header. */
    @Override
    public String resolveCsrfTokenValue(HttpServletRequest request, CsrfToken csrfToken) {
        return delegate.resolveCsrfTokenValue(new WithoutParameter(request, csrfToken.getParameterName()), csrfToken);
    }

    private static final class WithoutParameter extends HttpServletRequestWrapper {

        private final String hiddenParameter;

        WithoutParameter(HttpServletRequest request, String hiddenParameter) {
            super(request);
            this.hiddenParameter = hiddenParameter;
        }

        @Override
        public String getParameter(String name) {
            return hiddenParameter.equals(name) ? null : super.getParameter(name);
        }
    }
}
