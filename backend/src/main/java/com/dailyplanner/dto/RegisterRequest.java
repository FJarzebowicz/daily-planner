package com.dailyplanner.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank @Email String email,
    @NotBlank @Size(min = 8, max = 100)
    @Pattern(regexp = "^(?=.*[0-9])(?=.*[A-Z]).+$",
             message = "must contain at least 1 digit and 1 uppercase letter")
    String password,
    @NotBlank @Size(max = 100) String displayName
) {}
