package com.divido.controller;

import com.divido.dto.AuthUserResponse;
import com.divido.dto.CsrfTokenResponse;
import com.divido.dto.LoginRequest;
import com.divido.dto.RegisterRequest;
import com.divido.entity.AppUser;
import com.divido.exception.ResourceNotFoundException;
import com.divido.repository.AccountRepository;
import com.divido.security.DividoUserDetails;
import com.divido.service.LoginService;
import com.divido.service.RegistrationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.web.authentication.logout.LogoutHandler;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final RegistrationService registrationService;
    private final LoginService loginService;
    private final LogoutHandler logoutHandler;
    private final AccountRepository accounts;

    public AuthController(RegistrationService registrationService, LoginService loginService,
            LogoutHandler logoutHandler, AccountRepository accounts) {
        this.registrationService = registrationService;
        this.loginService = loginService;
        this.logoutHandler = logoutHandler;
        this.accounts = accounts;
    }

    /** DEC-025: creates the account only; the client signs in separately. */
    @PostMapping("/register")
    public ResponseEntity<AuthUserResponse> register(@Valid @RequestBody RegisterRequest request) {
        AppUser user = registrationService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new AuthUserResponse(new AuthUserResponse.AuthUser(user.getId(), user.getEmail(),
                        user.getDisplayName(), false)));
    }

    @PostMapping("/login")
    public AuthUserResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        DividoUserDetails user = loginService.login(request, httpRequest, httpResponse);
        return userResponse(user.getId());
    }

    /** Identity comes only from the session; request parameters are never consulted. */
    @GetMapping("/me")
    public AuthUserResponse me(@AuthenticationPrincipal DividoUserDetails user) {
        return userResponse(user.getId());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response,
            Authentication authentication) {
        logoutHandler.logout(request, response, authentication);
        return ResponseEntity.noContent().build();
    }

    /**
     * Returns a freshly masked token for the X-XSRF-TOKEN header. Reading it also sets
     * the HttpOnly CSRF cookie when the request has none.
     */
    @GetMapping("/csrf")
    public CsrfTokenResponse csrf(CsrfToken token) {
        return new CsrfTokenResponse(token.getHeaderName(), token.getToken());
    }

    /** Read fresh from the database: the display name can change (DEC-043), onboarding too (DEC-044). */
    private AuthUserResponse userResponse(UUID id) {
        AccountRepository.Profile profile = accounts.findProfile(id)
                .orElseThrow(() -> new ResourceNotFoundException("Account not found."));
        return new AuthUserResponse(new AuthUserResponse.AuthUser(profile.id(), profile.email(),
                profile.displayName(), profile.onboardingComplete()));
    }
}
