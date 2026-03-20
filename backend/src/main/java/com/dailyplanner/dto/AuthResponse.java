package com.dailyplanner.dto;

public record AuthResponse(
    String accessToken,
    String refreshToken,
    UserProfileDto user
) {}
