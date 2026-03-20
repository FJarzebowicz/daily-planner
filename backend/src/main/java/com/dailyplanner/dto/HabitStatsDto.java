package com.dailyplanner.dto;

import java.util.Map;

public record HabitStatsDto(
    int currentStreak,
    int longestStreak,
    int totalCompletions,
    double completionRateThisMonth,
    Map<String, Integer> completionsPerMonth
) {}
