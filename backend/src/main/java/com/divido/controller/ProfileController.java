package com.divido.controller;

import com.divido.dto.AccountDeletionRequest;
import com.divido.dto.PasswordChangeRequest;
import com.divido.dto.ProfileResponse;
import com.divido.dto.ProfileUpdateRequest;
import com.divido.security.DividoUserDetails;
import com.divido.service.ProfileService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextHolderStrategy;
import org.springframework.security.web.authentication.logout.LogoutHandler;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * PROFILE-001..005: the signed-in user's own account. There is no user ID in any path
 * or body; the session decides whose account it is.
 */
@RestController
@RequestMapping("/api/v1/profile")
public class ProfileController {

    private final ProfileService profileService;
    private final SecurityContextRepository securityContextRepository;
    private final LogoutHandler logoutHandler;
    private final SecurityContextHolderStrategy contextHolder = SecurityContextHolder.getContextHolderStrategy();

    public ProfileController(ProfileService profileService, SecurityContextRepository securityContextRepository,
            LogoutHandler logoutHandler) {
        this.profileService = profileService;
        this.securityContextRepository = securityContextRepository;
        this.logoutHandler = logoutHandler;
    }

    @GetMapping
    public ProfileResponse get(@AuthenticationPrincipal DividoUserDetails user) {
        return ProfileResponse.from(profileService.get(user.getId()));
    }

    @PatchMapping
    public ProfileResponse update(@AuthenticationPrincipal DividoUserDetails user,
            @Valid @RequestBody ProfileUpdateRequest request) {
        return ProfileResponse.from(profileService.updateDisplayName(user.getId(), request.displayName()));
    }

    /** DEC-044: finishing or skipping onboarding. Calling it again changes nothing. */
    @PostMapping("/onboarding-complete")
    public ProfileResponse completeOnboarding(@AuthenticationPrincipal DividoUserDetails user) {
        return ProfileResponse.from(profileService.completeOnboarding(user.getId()));
    }

    /**
     * DEC-043: other sessions of the account end on their next request; this one stays
     * signed in with a new session ID.
     */
    @PostMapping("/password")
    public ResponseEntity<Void> changePassword(@AuthenticationPrincipal DividoUserDetails user,
            @Valid @RequestBody PasswordChangeRequest request, HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        int version = profileService.changePassword(user.getId(), request.currentPassword(), request.newPassword());

        DividoUserDetails refreshed = new DividoUserDetails(user.getId(), user.getUsername(), null, version);
        SecurityContext context = contextHolder.createEmptyContext();
        context.setAuthentication(
                UsernamePasswordAuthenticationToken.authenticated(refreshed, null, refreshed.getAuthorities()));
        contextHolder.setContext(context);
        httpRequest.changeSessionId();
        securityContextRepository.saveContext(context, httpRequest, httpResponse);
        return ResponseEntity.noContent().build();
    }

    /** DEC-046: deletes everything the account owns, then signs this session out. */
    @DeleteMapping
    public ResponseEntity<Void> delete(@AuthenticationPrincipal DividoUserDetails user,
            @Valid @RequestBody AccountDeletionRequest request, HttpServletRequest httpRequest,
            HttpServletResponse httpResponse, Authentication authentication) {
        profileService.deleteAccount(user.getId(), request.password(), request.confirmation());
        logoutHandler.logout(httpRequest, httpResponse, authentication);
        return ResponseEntity.noContent().build();
    }
}
