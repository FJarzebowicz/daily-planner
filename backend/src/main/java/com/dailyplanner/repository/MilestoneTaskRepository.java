package com.dailyplanner.repository;

import com.dailyplanner.entity.MilestoneTask;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MilestoneTaskRepository extends JpaRepository<MilestoneTask, Long> {
    List<MilestoneTask> findByMilestoneId(Long milestoneId);
    boolean existsByMilestoneIdAndTaskId(Long milestoneId, Long taskId);
    void deleteByMilestoneIdAndTaskId(Long milestoneId, Long taskId);
}
