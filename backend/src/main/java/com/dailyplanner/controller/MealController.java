package com.dailyplanner.controller;

import com.dailyplanner.dto.MealDto;
import com.dailyplanner.service.MealService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
public class MealController {

    private final MealService mealService;

    public MealController(MealService mealService) {
        this.mealService = mealService;
    }

    @GetMapping("/days/{date}/meals")
    public List<MealDto> getByDay(@PathVariable String date) {
        return mealService.getByDay(LocalDate.parse(date));
    }

    @PutMapping("/meals/{id}")
    public MealDto update(@PathVariable Long id, @RequestBody MealDto dto) {
        return mealService.update(id, dto);
    }
}
