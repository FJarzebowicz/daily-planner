package com.dailyplanner.repository;

import com.dailyplanner.entity.GoalMasterTask;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GoalMasterTaskRepository extends JpaRepository<GoalMasterTask, Long> {
    Optional<GoalMasterTask> findByGoalId(Long goalId);
    Optional<GoalMasterTask> findByGoalIdAndGoalUserId(Long goalId, Long userId);
    void deleteByGoalId(Long goalId);
}
