package com.dailyplanner.service;

import com.dailyplanner.dto.DayDto;
import com.dailyplanner.dto.DayStatsDto;
import com.dailyplanner.entity.*;
import com.dailyplanner.exception.DayClosedException;
import com.dailyplanner.repository.*;
import com.dailyplanner.security.SecurityUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class DayService {

    private final DayRepository dayRepository;
    private final MealRepository mealRepository;
    private final TaskRepository taskRepository;
    private final ThoughtRepository thoughtRepository;

    public DayService(DayRepository dayRepository, MealRepository mealRepository,
                      TaskRepository taskRepository, ThoughtRepository thoughtRepository) {
        this.dayRepository = dayRepository;
        this.mealRepository = mealRepository;
        this.taskRepository = taskRepository;
        this.thoughtRepository = thoughtRepository;
    }

    @Transactional
    public Day getOrCreateDay(LocalDate date) {
        User user = SecurityUtil.getCurrentUser();
        return dayRepository.findByUserIdAndDate(user.getId(), date).orElseGet(() -> {
            Day day = new Day(date, user);
            day = dayRepository.save(day);
            createDefaultMeals(day);
            return day;
        });
    }

    private void createDefaultMeals(Day day) {
        for (MealSlot slot : MealSlot.values()) {
            Meal meal = new Meal(day, slot);
            mealRepository.save(meal);
        }
    }

    @Transactional
    public DayDto updateDay(LocalDate date, DayDto dto) {
        Day day = getOrCreateDay(date);

        if (day.isClosed() && !dto.closed()) {
            throw new DayClosedException();
        }

        if (dto.wakeUpTime() != null) day.setWakeUpTime(dto.wakeUpTime());
        if (dto.sleepTime() != null) day.setSleepTime(dto.sleepTime());

        if (dto.closed() && !day.isClosed()) {
            day.setClosed(true);
        }

        return DayDto.from(dayRepository.save(day));
    }

    @Transactional(readOnly = true)
    public DayStatsDto getStats(LocalDate date) {
        Day day = getOrCreateDay(date);
        List<Task> tasks = taskRepository.findByDayIdOrderBySortOrderAsc(day.getId());
        List<Meal> meals = mealRepository.findByDayIdOrderBySlotAsc(day.getId());
        List<Thought> thoughts = thoughtRepository.findByDayIdOrderByCreatedAtAsc(day.getId());

        int tasksDone = (int) tasks.stream().filter(Task::isCompleted).count();
        int productiveMinutes = tasks.stream()
                .filter(Task::isCompleted)
                .mapToInt(Task::getEstimatedMinutes)
                .sum();
        int mealsEaten = (int) meals.stream().filter(Meal::isEaten).count();
        int sleepMinutes = computeSleepMinutes(day.getWakeUpTime(), day.getSleepTime());

        return new DayStatsDto(
            tasksDone, tasks.size(),
            mealsEaten, meals.size(),
            productiveMinutes, sleepMinutes,
            thoughts.size()
        );
    }

    private int computeSleepMinutes(String wake, String sleep) {
        String[] wp = wake.split(":");
        String[] sp = sleep.split(":");
        int wakeMin = Integer.parseInt(wp[0]) * 60 + Integer.parseInt(wp[1]);
        int sleepMin = Integer.parseInt(sp[0]) * 60 + Integer.parseInt(sp[1]);
        int awake = sleepMin >= wakeMin ? sleepMin - wakeMin : 1440 - wakeMin + sleepMin;
        return 1440 - awake;
    }
}
