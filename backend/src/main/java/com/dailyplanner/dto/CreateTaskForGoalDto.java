package com.dailyplanner.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateTaskForGoalDto(
    @NotBlank String title,
    String description,
    @NotNull Long categoryId,
    int estimatedMinutes,
    String priority,
    String date
) {}
