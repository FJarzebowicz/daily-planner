package com.dailyplanner.dto;

import com.dailyplanner.entity.Milestone;

import java.util.List;

public record MilestoneDto(
    Long id,
    String name,
    String description,
    boolean completed,
    String deadline,
    int sortOrder,
    List<LinkedHabitDto> habits,
    List<LinkedTaskDto> tasks
) {
    public static MilestoneDto from(Milestone m, List<LinkedHabitDto> habits, List<LinkedTaskDto> tasks) {
        return new MilestoneDto(
            m.getId(), m.getName(), m.getDescription(),
            m.isCompleted(),
            m.getDeadline() != null ? m.getDeadline().toString() : null,
            m.getSortOrder(), habits, tasks
        );
    }
}
