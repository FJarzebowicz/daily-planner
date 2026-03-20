package com.dailyplanner.repository;

import com.dailyplanner.entity.HabitCompletion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface HabitCompletionRepository extends JpaRepository<HabitCompletion, Long> {
    Optional<HabitCompletion> findByHabitIdAndCompletedDate(Long habitId, LocalDate date);
    boolean existsByHabitIdAndCompletedDate(Long habitId, LocalDate date);
    List<HabitCompletion> findByHabitIdAndCompletedDateBetweenOrderByCompletedDateAsc(Long habitId, LocalDate from, LocalDate to);
    List<HabitCompletion> findByHabitIdOrderByCompletedDateAsc(Long habitId);
    long countByHabitId(Long habitId);
    void deleteByHabitIdAndCompletedDate(Long habitId, LocalDate date);
    List<HabitCompletion> findByHabitIdInAndCompletedDate(List<Long> habitIds, LocalDate date);
}
