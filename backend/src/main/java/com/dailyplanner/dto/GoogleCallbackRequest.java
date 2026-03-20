package com.dailyplanner.dto;

import jakarta.validation.constraints.NotBlank;

public record GoogleCallbackRequest(
    @NotBlank String code
) {}
