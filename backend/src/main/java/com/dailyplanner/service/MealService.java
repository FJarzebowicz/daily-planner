package com.dailyplanner.service;

import com.dailyplanner.dto.MealDto;
import com.dailyplanner.entity.Day;
import com.dailyplanner.entity.Meal;
import com.dailyplanner.entity.MealSlot;
import com.dailyplanner.exception.DayClosedException;
import com.dailyplanner.exception.ResourceNotFoundException;
import com.dailyplanner.repository.MealRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class MealService {

    private final MealRepository mealRepository;
    private final DayService dayService;

    public MealService(MealRepository mealRepository, DayService dayService) {
        this.mealRepository = mealRepository;
        this.dayService = dayService;
    }

    @Transactional
    public List<MealDto> getByDay(LocalDate date) {
        Day day = dayService.getOrCreateDay(date);
        List<Meal> meals = mealRepository.findByDayIdOrderBySlotAsc(day.getId());

        // Ensure all 5 slots exist
        if (meals.size() < MealSlot.values().length) {
            for (MealSlot slot : MealSlot.values()) {
                if (meals.stream().noneMatch(m -> m.getSlot() == slot)) {
                    Meal meal = new Meal(day, slot);
                    meals.add(mealRepository.save(meal));
                }
            }
            meals = mealRepository.findByDayIdOrderBySlotAsc(day.getId());
        }

        return meals.stream().map(MealDto::from).toList();
    }

    @Transactional
    public MealDto update(Long id, MealDto dto) {
        Meal meal = mealRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Meal not found: " + id));
        if (meal.getDay().isClosed()) throw new DayClosedException();

        if (dto.description() != null) meal.setDescription(dto.description());
        meal.setEaten(dto.eaten());

        return MealDto.from(mealRepository.save(meal));
    }
}
