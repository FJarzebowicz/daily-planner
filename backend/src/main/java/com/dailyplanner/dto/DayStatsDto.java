package com.dailyplanner.dto;

public record DayStatsDto(
    int tasksDone,
    int tasksTotal,
    int mealsEaten,
    int mealsTotal,
    int productiveMinutes,
    int sleepMinutes,
    int thoughtsCount
) {}
