package com.dailyplanner.service;

import com.dailyplanner.dto.HabitCompletionDto;
import com.dailyplanner.dto.HabitDto;
import com.dailyplanner.dto.HabitForDateDto;
import com.dailyplanner.dto.HabitStatsDto;
import com.dailyplanner.entity.Category;
import com.dailyplanner.entity.Habit;
import com.dailyplanner.entity.HabitCompletion;
import com.dailyplanner.entity.ScheduleType;
import com.dailyplanner.entity.User;
import com.dailyplanner.exception.ResourceNotFoundException;
import com.dailyplanner.repository.CategoryRepository;
import com.dailyplanner.repository.HabitCompletionRepository;
import com.dailyplanner.repository.HabitRepository;
import com.dailyplanner.security.SecurityUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class HabitService {

    private final HabitRepository habitRepository;
    private final HabitCompletionRepository completionRepository;
    private final CategoryRepository categoryRepository;

    public HabitService(HabitRepository habitRepository,
                        HabitCompletionRepository completionRepository,
                        CategoryRepository categoryRepository) {
        this.habitRepository = habitRepository;
        this.completionRepository = completionRepository;
        this.categoryRepository = categoryRepository;
    }

    public List<HabitDto> getAll() {
        Long userId = SecurityUtil.getCurrentUserId();
        return habitRepository.findByUserIdOrderByNameAsc(userId).stream()
                .map(HabitDto::from).toList();
    }

    @Transactional
    public HabitDto create(HabitDto dto) {
        User user = SecurityUtil.getCurrentUser();
        Habit habit = new Habit();
        habit.setUser(user);
        habit.setName(dto.name());
        habit.setDescription(dto.description());
        habit.setScheduleType(dto.scheduleType() != null ? ScheduleType.valueOf(dto.scheduleType()) : ScheduleType.DAILY);
        habit.setScheduleDays(dto.scheduleDays());
        habit.setScheduleInterval(dto.scheduleInterval());
        habit.setStartDate(dto.startDate() != null ? LocalDate.parse(dto.startDate()) : LocalDate.now());
        habit.setActive(dto.active());
        habit.setStreakGoal(dto.streakGoal());
        if (dto.categoryId() != null) {
            Category category = categoryRepository.findByIdAndUserId(dto.categoryId(), user.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + dto.categoryId()));
            habit.setCategory(category);
        }
        return HabitDto.from(habitRepository.save(habit));
    }

    @Transactional
    public HabitDto update(Long id, HabitDto dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        Habit habit = habitRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Habit not found: " + id));
        habit.setName(dto.name());
        habit.setDescription(dto.description());
        habit.setScheduleType(dto.scheduleType() != null ? ScheduleType.valueOf(dto.scheduleType()) : ScheduleType.DAILY);
        habit.setScheduleDays(dto.scheduleDays());
        habit.setScheduleInterval(dto.scheduleInterval());
        if (dto.startDate() != null) {
            habit.setStartDate(LocalDate.parse(dto.startDate()));
        }
        habit.setActive(dto.active());
        habit.setStreakGoal(dto.streakGoal());
        if (dto.categoryId() != null) {
            Category category = categoryRepository.findByIdAndUserId(dto.categoryId(), userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + dto.categoryId()));
            habit.setCategory(category);
        } else {
            habit.setCategory(null);
        }
        return HabitDto.from(habitRepository.save(habit));
    }

    @Transactional
    public void delete(Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        if (!habitRepository.existsByIdAndUserId(id, userId)) {
            throw new ResourceNotFoundException("Habit not found: " + id);
        }
        habitRepository.deleteByIdAndUserId(id, userId);
    }

    @Transactional
    public HabitDto togglePause(Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        Habit habit = habitRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Habit not found: " + id));
        habit.setActive(!habit.isActive());
        return HabitDto.from(habitRepository.save(habit));
    }

    @Transactional
    public HabitCompletionDto complete(Long id, LocalDate date) {
        Long userId = SecurityUtil.getCurrentUserId();
        Habit habit = habitRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Habit not found: " + id));
        if (completionRepository.existsByHabitIdAndCompletedDate(id, date)) {
            HabitCompletion existing = completionRepository.findByHabitIdAndCompletedDate(id, date).get();
            return HabitCompletionDto.from(existing);
        }
        HabitCompletion completion = new HabitCompletion();
        completion.setHabit(habit);
        completion.setCompletedDate(date);
        completion.setCompletedAt(LocalDateTime.now());
        return HabitCompletionDto.from(completionRepository.save(completion));
    }

    @Transactional
    public void uncomplete(Long id, LocalDate date) {
        Long userId = SecurityUtil.getCurrentUserId();
        if (!habitRepository.existsByIdAndUserId(id, userId)) {
            throw new ResourceNotFoundException("Habit not found: " + id);
        }
        completionRepository.deleteByHabitIdAndCompletedDate(id, date);
    }

    public HabitStatsDto getStats(Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        Habit habit = habitRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Habit not found: " + id));

        List<HabitCompletion> allCompletions = completionRepository.findByHabitIdOrderByCompletedDateAsc(id);
        List<LocalDate> sortedDates = allCompletions.stream()
                .map(HabitCompletion::getCompletedDate).toList();
        Set<LocalDate> completionDates = new HashSet<>(sortedDates);

        int currentStreak = calculateCurrentStreak(habit, completionDates);
        int longestStreak = calculateLongestStreak(habit, sortedDates);
        int totalCompletions = (int) completionRepository.countByHabitId(id);

        // Completion rate this month
        YearMonth thisMonth = YearMonth.now();
        LocalDate monthStart = thisMonth.atDay(1);
        LocalDate monthEnd = thisMonth.atEndOfMonth();
        LocalDate today = LocalDate.now();
        LocalDate effectiveEnd = today.isBefore(monthEnd) ? today : monthEnd;

        int scheduledThisMonth = 0;
        int completedThisMonth = 0;
        for (LocalDate d = monthStart; !d.isAfter(effectiveEnd); d = d.plusDays(1)) {
            if (isScheduledForDate(habit, d)) {
                scheduledThisMonth++;
                if (completionDates.contains(d)) {
                    completedThisMonth++;
                }
            }
        }
        double completionRate = scheduledThisMonth > 0 ? (double) completedThisMonth / scheduledThisMonth : 0.0;

        // Completions per month
        Map<String, Integer> completionsPerMonth = allCompletions.stream()
                .collect(Collectors.groupingBy(
                        c -> c.getCompletedDate().getYear() + "-" +
                             String.format("%02d", c.getCompletedDate().getMonthValue()),
                        LinkedHashMap::new,
                        Collectors.summingInt(c -> 1)
                ));

        return new HabitStatsDto(currentStreak, longestStreak, totalCompletions, completionRate, completionsPerMonth);
    }

    public List<HabitCompletionDto> getCompletions(Long id, LocalDate from, LocalDate to) {
        Long userId = SecurityUtil.getCurrentUserId();
        if (!habitRepository.existsByIdAndUserId(id, userId)) {
            throw new ResourceNotFoundException("Habit not found: " + id);
        }
        return completionRepository.findByHabitIdAndCompletedDateBetweenOrderByCompletedDateAsc(id, from, to)
                .stream().map(HabitCompletionDto::from).toList();
    }

    public List<HabitForDateDto> getHabitsForDate(LocalDate date) {
        Long userId = SecurityUtil.getCurrentUserId();
        List<Habit> activeHabits = habitRepository.findByUserIdAndActiveTrueOrderByNameAsc(userId);

        List<Habit> scheduledHabits = activeHabits.stream()
                .filter(h -> isScheduledForDate(h, date))
                .toList();

        if (scheduledHabits.isEmpty()) {
            return List.of();
        }

        List<Long> habitIds = scheduledHabits.stream().map(Habit::getId).toList();
        Set<Long> completedHabitIds = completionRepository.findByHabitIdInAndCompletedDate(habitIds, date)
                .stream().map(c -> c.getHabit().getId()).collect(Collectors.toSet());

        return scheduledHabits.stream()
                .map(h -> HabitForDateDto.from(h, completedHabitIds.contains(h.getId())))
                .toList();
    }

    private boolean isScheduledForDate(Habit habit, LocalDate date) {
        if (date.isBefore(habit.getStartDate())) return false;
        switch (habit.getScheduleType()) {
            case DAILY:
                return true;
            case SPECIFIC_DAYS:
                if (habit.getScheduleDays() == null) return false;
                String dayOfWeek = date.getDayOfWeek().name().substring(0, 3); // MON, TUE, etc.
                return Arrays.asList(habit.getScheduleDays().split(",")).contains(dayOfWeek);
            case EVERY_X_DAYS:
                if (habit.getScheduleInterval() == null || habit.getScheduleInterval() <= 0) return false;
                long daysBetween = ChronoUnit.DAYS.between(habit.getStartDate(), date);
                return daysBetween % habit.getScheduleInterval() == 0;
            default:
                return false;
        }
    }

    private int calculateCurrentStreak(Habit habit, Set<LocalDate> completionDates) {
        int streak = 0;
        LocalDate date = LocalDate.now();
        // If today is scheduled but not completed yet, start from yesterday
        if (isScheduledForDate(habit, date) && !completionDates.contains(date)) {
            date = date.minusDays(1);
        }
        while (true) {
            if (date.isBefore(habit.getStartDate())) break;
            if (isScheduledForDate(habit, date)) {
                if (completionDates.contains(date)) {
                    streak++;
                } else {
                    break;
                }
            }
            date = date.minusDays(1);
        }
        return streak;
    }

    private int calculateLongestStreak(Habit habit, List<LocalDate> sortedCompletionDates) {
        if (sortedCompletionDates.isEmpty()) return 0;
        int longest = 0;
        int current = 0;
        Set<LocalDate> completionSet = new HashSet<>(sortedCompletionDates);
        LocalDate start = sortedCompletionDates.get(0);
        LocalDate end = sortedCompletionDates.get(sortedCompletionDates.size() - 1);
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            if (!isScheduledForDate(habit, d)) continue;
            if (completionSet.contains(d)) {
                current++;
                longest = Math.max(longest, current);
            } else {
                current = 0;
            }
        }
        return longest;
    }
}
