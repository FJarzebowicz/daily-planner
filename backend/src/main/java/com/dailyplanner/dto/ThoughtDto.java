package com.dailyplanner.dto;

import com.dailyplanner.entity.Thought;
import jakarta.validation.constraints.NotBlank;

public record ThoughtDto(
    Long id,
    Long dayId,
    @NotBlank String content,
    String createdAt
) {
    public static ThoughtDto from(Thought t) {
        return new ThoughtDto(t.getId(), t.getDay().getId(), t.getContent(), t.getCreatedAt().toString());
    }
}
