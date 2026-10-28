package com.divido.controller;

import com.divido.dto.AuthUserResponse;
import com.divido.dto.RegisterRequest;
import com.divido.entity.AppUser;
import com.divido.service.RegistrationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final RegistrationService registrationService;

    public AuthController(RegistrationService registrationService) {
        this.registrationService = registrationService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthUserResponse> register(@Valid @RequestBody RegisterRequest request) {
        AppUser user = registrationService.register(request);
        // No onboarding flow exists yet, so a newly registered user has not completed it.
        var body = new AuthUserResponse(new AuthUserResponse.AuthUser(user.getId(), user.getEmail(), false));
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }
}
