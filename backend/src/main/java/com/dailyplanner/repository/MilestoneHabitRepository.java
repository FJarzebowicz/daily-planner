package com.dailyplanner.repository;

import com.dailyplanner.entity.MilestoneHabit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MilestoneHabitRepository extends JpaRepository<MilestoneHabit, Long> {
    List<MilestoneHabit> findByMilestoneId(Long milestoneId);
    boolean existsByMilestoneIdAndHabitId(Long milestoneId, Long habitId);
    void deleteByMilestoneIdAndHabitId(Long milestoneId, Long habitId);
}
