package com.dailyplanner.dto;

import com.dailyplanner.entity.Meal;

public record MealDto(
    Long id,
    Long dayId,
    String slot,
    String description,
    boolean eaten
) {
    public static MealDto from(Meal meal) {
        return new MealDto(
            meal.getId(),
            meal.getDay().getId(),
            meal.getSlot().name(),
            meal.getDescription(),
            meal.isEaten()
        );
    }
}
