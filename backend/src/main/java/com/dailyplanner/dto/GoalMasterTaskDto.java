package com.dailyplanner.dto;

import com.dailyplanner.entity.GoalMasterTask;

import java.util.List;

public record GoalMasterTaskDto(
    Long id,
    String name,
    String description,
    List<LinkedHabitDto> habits,
    List<LinkedTaskDto> tasks
) {
    public static GoalMasterTaskDto from(GoalMasterTask mt, List<LinkedHabitDto> habits, List<LinkedTaskDto> tasks) {
        return new GoalMasterTaskDto(mt.getId(), mt.getName(), mt.getDescription(), habits, tasks);
    }
}
