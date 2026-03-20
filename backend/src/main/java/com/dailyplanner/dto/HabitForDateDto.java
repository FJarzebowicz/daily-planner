package com.dailyplanner.dto;

import com.dailyplanner.entity.Habit;

public record HabitForDateDto(
    Long id,
    String name,
    String description,
    Long categoryId,
    String categoryName,
    String categoryColor,
    boolean completed,
    String scheduleType
) {
    public static HabitForDateDto from(Habit h, boolean completed) {
        return new HabitForDateDto(
            h.getId(), h.getName(), h.getDescription(),
            h.getCategory() != null ? h.getCategory().getId() : null,
            h.getCategory() != null ? h.getCategory().getName() : null,
            h.getCategory() != null ? h.getCategory().getColor() : null,
            completed, h.getScheduleType().name()
        );
    }
}
