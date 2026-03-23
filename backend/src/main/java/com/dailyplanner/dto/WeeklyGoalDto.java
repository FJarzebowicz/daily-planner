package com.dailyplanner.dto;

import com.dailyplanner.entity.WeeklyGoal;

/**
 * DTO dla celu tygodniowego.
 *
 * goalName jest denormalizowany z powiązanego Goal — dla wygody frontendu.
 * weekStart to zawsze data poniedziałku w formacie YYYY-MM-DD.
 */
public record WeeklyGoalDto(
    Long id,
    Long goalId,
    String goalName,
    String weekStart,
    String description,
    boolean achieved,
    String createdAt
) {
    /**
     * Fabryka — konwertuje encję WeeklyGoal na DTO.
     * Wymaga załadowanego powiązania goal (EAGER lub w ramach transakcji).
     */
    public static WeeklyGoalDto from(WeeklyGoal wg) {
        return new WeeklyGoalDto(
            wg.getId(),
            wg.getGoal().getId(),
            wg.getGoal().getName(),
            wg.getWeekStart().toString(),
            wg.getDescription(),
            wg.isAchieved(),
            wg.getCreatedAt().toString()
        );
    }
}
