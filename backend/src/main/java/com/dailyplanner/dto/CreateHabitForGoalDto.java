package com.dailyplanner.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateHabitForGoalDto(
    @NotBlank String name,
    String description,
    Long categoryId,
    String scheduleType,
    String scheduleDays,
    Integer scheduleInterval,
    String startDate,
    Integer streakGoal
) {}
