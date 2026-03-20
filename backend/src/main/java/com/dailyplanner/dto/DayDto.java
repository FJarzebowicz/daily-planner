package com.dailyplanner.dto;

import com.dailyplanner.entity.Day;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record DayDto(
    Long id,
    @NotNull String date,
    @Pattern(regexp = "\\d{2}:\\d{2}") String wakeUpTime,
    @Pattern(regexp = "\\d{2}:\\d{2}") String sleepTime,
    boolean closed
) {
    public static DayDto from(Day day) {
        return new DayDto(
            day.getId(),
            day.getDate().toString(),
            day.getWakeUpTime(),
            day.getSleepTime(),
            day.isClosed()
        );
    }
}
