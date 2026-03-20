package com.dailyplanner.dto;

import com.dailyplanner.entity.BacklogTask;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record BacklogTaskDto(
    Long id,
    @NotBlank String name,
    String description,
    @Min(0) int estimatedMinutes,
    @NotNull String priority,
    String createdAt
) {
    public static BacklogTaskDto from(BacklogTask t) {
        return new BacklogTaskDto(
            t.getId(), t.getName(), t.getDescription(),
            t.getEstimatedMinutes(), t.getPriority().name(),
            t.getCreatedAt().toString()
        );
    }
}
