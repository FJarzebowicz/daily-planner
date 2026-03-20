package com.dailyplanner.controller;

import com.dailyplanner.dto.*;
import com.dailyplanner.service.AuthService;
import com.dailyplanner.service.GoogleOAuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final GoogleOAuthService googleOAuthService;

    public AuthController(AuthService authService, GoogleOAuthService googleOAuthService) {
        this.authService = authService;
        this.googleOAuthService = googleOAuthService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return authService.refresh(request);
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@RequestBody RefreshRequest request) {
        authService.logout(request.refreshToken());
    }

    @GetMapping("/google")
    public Map<String, String> googleRedirect() {
        return Map.of("url", googleOAuthService.getAuthorizationUrl());
    }

    @PostMapping("/google/callback")
    public AuthResponse googleCallback(@Valid @RequestBody GoogleCallbackRequest request) {
        GoogleOAuthService.GoogleUserInfo info = googleOAuthService.exchangeCodeForUserInfo(request.code());
        return authService.loginOrCreateGoogleUser(info.email(), info.name(), info.picture());
    }
}
