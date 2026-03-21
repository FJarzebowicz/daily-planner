package com.dailyplanner.repository;

import com.dailyplanner.entity.GoalMasterTaskTask;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GoalMasterTaskTaskRepository extends JpaRepository<GoalMasterTaskTask, Long> {
    List<GoalMasterTaskTask> findByMasterTaskId(Long masterTaskId);
    boolean existsByMasterTaskIdAndTaskId(Long masterTaskId, Long taskId);
    void deleteByMasterTaskIdAndTaskId(Long masterTaskId, Long taskId);
}
