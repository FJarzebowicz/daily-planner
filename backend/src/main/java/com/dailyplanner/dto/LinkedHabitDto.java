package com.dailyplanner.dto;

import com.dailyplanner.entity.Habit;

public record LinkedHabitDto(
    Long habitId,
    String name,
    String description,
    String categoryName,
    String categoryColor,
    Boolean completed
) {
    public static LinkedHabitDto from(Habit h, Boolean completed) {
        return new LinkedHabitDto(
            h.getId(), h.getName(), h.getDescription(),
            h.getCategory() != null ? h.getCategory().getName() : null,
            h.getCategory() != null ? h.getCategory().getColor() : null,
            completed
        );
    }
}
