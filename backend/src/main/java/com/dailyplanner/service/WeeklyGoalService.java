package com.dailyplanner.service;

import com.dailyplanner.dto.WeeklyGoalDto;
import com.dailyplanner.entity.Goal;
import com.dailyplanner.entity.User;
import com.dailyplanner.entity.WeeklyGoal;
import com.dailyplanner.exception.ResourceNotFoundException;
import com.dailyplanner.repository.GoalRepository;
import com.dailyplanner.repository.WeeklyGoalRepository;
import com.dailyplanner.security.SecurityUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Serwis celów tygodniowych.
 *
 * Każda operacja jest scope'owana per userId z SecurityUtil,
 * co zapewnia izolację danych między użytkownikami.
 */
@Service
public class WeeklyGoalService {

    private final WeeklyGoalRepository weeklyGoalRepository;
    private final GoalRepository goalRepository;

    public WeeklyGoalService(WeeklyGoalRepository weeklyGoalRepository,
                              GoalRepository goalRepository) {
        this.weeklyGoalRepository = weeklyGoalRepository;
        this.goalRepository = goalRepository;
    }

    /**
     * Pobiera wszystkie cele tygodniowe użytkownika dla danego tygodnia.
     * readOnly = true — optymalizacja zapisu, sesja otwarta dla lazy loading goal.
     *
     * @param weekStartStr data poniedziałku w formacie YYYY-MM-DD
     */
    @Transactional(readOnly = true)
    public List<WeeklyGoalDto> getByWeek(String weekStartStr) {
        Long userId = SecurityUtil.getCurrentUserId();
        LocalDate weekStart = LocalDate.parse(weekStartStr);
        return weeklyGoalRepository.findByUserIdAndWeekStart(userId, weekStart)
                .stream()
                .map(WeeklyGoalDto::from)
                .toList();
    }

    /**
     * Tworzy nowy cel tygodniowy dla bieżącego użytkownika.
     * Unikalność (user, goal, weekStart) jest enforced przez DB constraint.
     */
    @Transactional
    public WeeklyGoalDto create(WeeklyGoalDto dto) {
        User user = SecurityUtil.getCurrentUser();
        Long userId = user.getId();

        Goal goal = goalRepository.findByIdAndUserId(dto.goalId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found: " + dto.goalId()));

        WeeklyGoal wg = new WeeklyGoal();
        wg.setUser(user);
        wg.setGoal(goal);
        wg.setWeekStart(LocalDate.parse(dto.weekStart()));
        wg.setDescription(dto.description() != null ? dto.description() : "");

        return WeeklyGoalDto.from(weeklyGoalRepository.save(wg));
    }

    /**
     * Aktualizuje opis i/lub status achieved celu tygodniowego.
     */
    @Transactional
    public WeeklyGoalDto update(Long id, WeeklyGoalDto dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        WeeklyGoal wg = weeklyGoalRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("WeeklyGoal not found: " + id));

        if (dto.description() != null) {
            wg.setDescription(dto.description());
        }
        wg.setAchieved(dto.achieved());

        return WeeklyGoalDto.from(weeklyGoalRepository.save(wg));
    }

    /**
     * Przełącza flagę achieved (true ↔ false).
     */
    @Transactional
    public WeeklyGoalDto toggleAchieved(Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        WeeklyGoal wg = weeklyGoalRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("WeeklyGoal not found: " + id));

        wg.setAchieved(!wg.isAchieved());
        return WeeklyGoalDto.from(weeklyGoalRepository.save(wg));
    }

    /**
     * Usuwa cel tygodniowy.
     * Powiązane taski mają ON DELETE SET NULL — weeklyGoalId zostaje wyzerowany.
     */
    @Transactional
    public void delete(Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        if (!weeklyGoalRepository.existsByIdAndUserId(id, userId)) {
            throw new ResourceNotFoundException("WeeklyGoal not found: " + id);
        }
        weeklyGoalRepository.deleteByIdAndUserId(id, userId);
    }
}
