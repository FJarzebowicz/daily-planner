package com.dailyplanner.repository;

import com.dailyplanner.entity.Habit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface HabitRepository extends JpaRepository<Habit, Long> {
    List<Habit> findByUserIdAndActiveTrueOrderByNameAsc(Long userId);
    List<Habit> findByUserIdOrderByNameAsc(Long userId);
    Optional<Habit> findByIdAndUserId(Long id, Long userId);
    boolean existsByIdAndUserId(Long id, Long userId);
    void deleteByIdAndUserId(Long id, Long userId);
}
