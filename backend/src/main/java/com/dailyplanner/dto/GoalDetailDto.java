package com.dailyplanner.dto;

import com.dailyplanner.entity.Goal;

import java.util.List;

public record GoalDetailDto(
    Long id,
    String name,
    String description,
    String rules,
    String deadline,
    String status,
    double progress,
    int milestonesCount,
    int milestonesCompleted,
    String createdAt,
    GoalMasterTaskDto masterTask,
    List<MilestoneDto> milestones
) {
    public static GoalDetailDto from(Goal g, int milestonesCount, int milestonesCompleted,
                                      GoalMasterTaskDto masterTask, List<MilestoneDto> milestones) {
        double progress;
        if (milestonesCount == 0) {
            progress = "COMPLETED".equals(g.getStatus().name()) ? 100.0 : 0.0;
        } else {
            progress = (double) milestonesCompleted / milestonesCount * 100.0;
        }
        return new GoalDetailDto(
            g.getId(), g.getName(), g.getDescription(), g.getRules(),
            g.getDeadline() != null ? g.getDeadline().toString() : null,
            g.getStatus().name(), progress, milestonesCount, milestonesCompleted,
            g.getCreatedAt().toString(), masterTask, milestones
        );
    }
}
