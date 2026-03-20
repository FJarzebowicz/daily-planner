package com.dailyplanner.repository;

import com.dailyplanner.entity.Meal;
import com.dailyplanner.entity.MealSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface MealRepository extends JpaRepository<Meal, Long> {
    List<Meal> findByDayIdOrderBySlotAsc(Long dayId);
    Optional<Meal> findByDayIdAndSlot(Long dayId, MealSlot slot);
}
