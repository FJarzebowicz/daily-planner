package com.dailyplanner.dto;

import com.dailyplanner.entity.Habit;
import jakarta.validation.constraints.NotBlank;

public record HabitDto(
    Long id,
    @NotBlank String name,
    String description,
    Long categoryId,
    String categoryName,
    String categoryColor,
    String scheduleType,
    String scheduleDays,
    Integer scheduleInterval,
    String startDate,
    boolean active,
    Integer streakGoal,
    Long goalId,
    Long milestoneId,
    String createdAt
) {
    public static HabitDto from(Habit h) {
        return new HabitDto(
            h.getId(), h.getName(), h.getDescription(),
            h.getCategory() != null ? h.getCategory().getId() : null,
            h.getCategory() != null ? h.getCategory().getName() : null,
            h.getCategory() != null ? h.getCategory().getColor() : null,
            h.getScheduleType().name(), h.getScheduleDays(), h.getScheduleInterval(),
            h.getStartDate().toString(), h.isActive(), h.getStreakGoal(),
            h.getGoal() != null ? h.getGoal().getId() : null,
            h.getMilestone() != null ? h.getMilestone().getId() : null,
            h.getCreatedAt().toString()
        );
    }
}
