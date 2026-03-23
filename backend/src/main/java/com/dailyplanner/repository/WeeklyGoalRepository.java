package com.dailyplanner.repository;

import com.dailyplanner.entity.WeeklyGoal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repozytorium celów tygodniowych.
 * Wszystkie zapytania są scope'owane per userId — bezpieczeństwo danych.
 */
public interface WeeklyGoalRepository extends JpaRepository<WeeklyGoal, Long> {

    /** Pobiera wszystkie cele tygodniowe użytkownika dla danego tygodnia */
    List<WeeklyGoal> findByUserIdAndWeekStart(Long userId, LocalDate weekStart);

    /** Pobiera cel tygodniowy po id z weryfikacją właściciela */
    Optional<WeeklyGoal> findByIdAndUserId(Long id, Long userId);

    /** Sprawdza czy rekord istnieje i należy do użytkownika — przed operacjami delete */
    boolean existsByIdAndUserId(Long id, Long userId);

    /** Usuwa cel tygodniowy z weryfikacją właściciela */
    void deleteByIdAndUserId(Long id, Long userId);
}
