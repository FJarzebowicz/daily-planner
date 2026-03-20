package com.dailyplanner.repository;

import com.dailyplanner.entity.Milestone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MilestoneRepository extends JpaRepository<Milestone, Long> {
    List<Milestone> findByGoalIdOrderBySortOrderAsc(Long goalId);
    Optional<Milestone> findByIdAndGoalId(Long id, Long goalId);
    int countByGoalId(Long goalId);
    int countByGoalIdAndCompletedTrue(Long goalId);
}
