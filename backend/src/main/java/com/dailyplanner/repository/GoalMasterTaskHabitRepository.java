package com.dailyplanner.repository;

import com.dailyplanner.entity.GoalMasterTaskHabit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GoalMasterTaskHabitRepository extends JpaRepository<GoalMasterTaskHabit, Long> {
    List<GoalMasterTaskHabit> findByMasterTaskId(Long masterTaskId);
    boolean existsByMasterTaskIdAndHabitId(Long masterTaskId, Long habitId);
    void deleteByMasterTaskIdAndHabitId(Long masterTaskId, Long habitId);
}
