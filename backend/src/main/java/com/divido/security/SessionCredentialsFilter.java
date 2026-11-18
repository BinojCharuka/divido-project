package com.divido.security;

import com.divido.repository.AccountRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextHolderStrategy;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.OptionalInt;

/**
 * Ends a session whose sign-in is no longer valid: the password was changed or reset
 * since (DEC-043, DEC-045), or the account was deleted (DEC-046). Sessions are held in
 * memory, so this check is what reaches the user's other browsers and devices.
 *
 * <p>Runs right after the security context is loaded. A stale session is invalidated
 * and the request continues unauthenticated, so protected endpoints answer
 * {@code 401 UNAUTHENTICATED} as for any expired session.
 */
public class SessionCredentialsFilter extends OncePerRequestFilter {

    private final AccountRepository accounts;
    private final SecurityContextHolderStrategy contextHolder = SecurityContextHolder.getContextHolderStrategy();

    public SessionCredentialsFilter(AccountRepository accounts) {
        this.accounts = accounts;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        Authentication authentication = contextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof DividoUserDetails user) {
            OptionalInt current = accounts.credentialsVersion(user.getId());
            if (current.isEmpty() || current.getAsInt() != user.getCredentialsVersion()) {
                HttpSession session = request.getSession(false);
                if (session != null) {
                    session.invalidate();
                }
                contextHolder.clearContext();
            }
        }
        chain.doFilter(request, response);
    }
}
