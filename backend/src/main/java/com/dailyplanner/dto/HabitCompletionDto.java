package com.dailyplanner.dto;

import com.dailyplanner.entity.HabitCompletion;

public record HabitCompletionDto(
    Long id,
    String completedDate,
    String completedAt
) {
    public static HabitCompletionDto from(HabitCompletion c) {
        return new HabitCompletionDto(c.getId(), c.getCompletedDate().toString(), c.getCompletedAt().toString());
    }
}
