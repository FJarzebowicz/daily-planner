package com.dailyplanner.dto;

import com.dailyplanner.entity.Task;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record TaskDto(
    Long id,
    Long dayId,
    @NotNull Long categoryId,
    @NotBlank String title,
    String description,
    @Min(0) int estimatedMinutes,
    @NotNull String priority,
    int sortOrder,
    boolean completed
) {
    public static TaskDto from(Task task) {
        return new TaskDto(
            task.getId(),
            task.getDay().getId(),
            task.getCategory().getId(),
            task.getTitle(),
            task.getDescription(),
            task.getEstimatedMinutes(),
            task.getPriority().name(),
            task.getSortOrder(),
            task.isCompleted()
        );
    }
}
