package com.divido.service;

import com.divido.dto.LoginRequest;
import com.divido.security.DividoUserDetails;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextHolderStrategy;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

@Service
public class LoginService {

    /** No stored password can be longer, and BCrypt rejects longer input. */
    private static final int BCRYPT_MAX_PASSWORD_BYTES = 72;

    private final AuthenticationManager authenticationManager;
    private final SessionAuthenticationStrategy sessionAuthenticationStrategy;
    private final SecurityContextRepository securityContextRepository;
    private final SecurityContextHolderStrategy contextHolder = SecurityContextHolder.getContextHolderStrategy();

    public LoginService(AuthenticationManager authenticationManager,
            SessionAuthenticationStrategy sessionAuthenticationStrategy,
            SecurityContextRepository securityContextRepository) {
        this.authenticationManager = authenticationManager;
        this.sessionAuthenticationStrategy = sessionAuthenticationStrategy;
        this.securityContextRepository = securityContextRepository;
    }

    /**
     * Authenticates, rotates the session ID and CSRF token, and stores the
     * authenticated context in the session.
     *
     * @throws BadCredentialsException for an unknown email or a wrong password alike
     */
    public DividoUserDetails login(LoginRequest login, HttpServletRequest request, HttpServletResponse response) {
        if (login.password().getBytes(StandardCharsets.UTF_8).length > BCRYPT_MAX_PASSWORD_BYTES) {
            throw new BadCredentialsException("Bad credentials");
        }

        Authentication authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(login.email(), login.password()));
        sessionAuthenticationStrategy.onAuthentication(authentication, request, response);

        SecurityContext context = contextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        contextHolder.setContext(context);
        securityContextRepository.saveContext(context, request, response);
        return (DividoUserDetails) authentication.getPrincipal();
    }
}
