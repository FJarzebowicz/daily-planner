package com.dailyplanner.dto;

import com.dailyplanner.entity.RecurringEvent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record RecurringEventDto(
    Long id,
    @NotBlank String name,
    @NotBlank @Pattern(regexp = "\\d{2}:\\d{2}") String startTime,
    @NotBlank @Pattern(regexp = "\\d{2}:\\d{2}") String endTime,
    boolean active
) {
    public static RecurringEventDto from(RecurringEvent e) {
        return new RecurringEventDto(e.getId(), e.getName(), e.getStartTime(), e.getEndTime(), e.isActive());
    }
}
