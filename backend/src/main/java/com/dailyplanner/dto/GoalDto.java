package com.dailyplanner.dto;

import com.dailyplanner.entity.Goal;

public record GoalDto(
    Long id,
    String name,
    String description,
    String rules,
    String deadline,
    String status,
    double progress,
    int milestonesCount,
    int milestonesCompleted,
    String createdAt
) {
    public static GoalDto from(Goal g, int milestonesCount, int milestonesCompleted) {
        double progress;
        if (milestonesCount == 0) {
            progress = "COMPLETED".equals(g.getStatus().name()) ? 100.0 : 0.0;
        } else {
            progress = (double) milestonesCompleted / milestonesCount * 100.0;
        }
        return new GoalDto(
            g.getId(), g.getName(), g.getDescription(), g.getRules(),
            g.getDeadline() != null ? g.getDeadline().toString() : null,
            g.getStatus().name(), progress, milestonesCount, milestonesCompleted,
            g.getCreatedAt().toString()
        );
    }
}
