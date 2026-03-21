package com.dailyplanner.dto;

import com.dailyplanner.entity.Task;

public record LinkedTaskDto(
    Long taskId,
    String title,
    String description,
    String categoryName,
    boolean completed,
    int estimatedMinutes
) {
    public static LinkedTaskDto from(Task t) {
        return new LinkedTaskDto(
            t.getId(), t.getTitle(), t.getDescription(),
            t.getCategory() != null ? t.getCategory().getName() : null,
            t.isCompleted(), t.getEstimatedMinutes()
        );
    }
}
