package com.dailyplanner.controller;

import com.dailyplanner.dto.DayDto;
import com.dailyplanner.dto.DayStatsDto;
import com.dailyplanner.service.DayService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/days")
public class DayController {

    private final DayService dayService;

    public DayController(DayService dayService) {
        this.dayService = dayService;
    }

    @GetMapping("/{date}")
    public DayDto getDay(@PathVariable String date) {
        return DayDto.from(dayService.getOrCreateDay(LocalDate.parse(date)));
    }

    @PutMapping("/{date}")
    public DayDto updateDay(@PathVariable String date, @Valid @RequestBody DayDto dto) {
        return dayService.updateDay(LocalDate.parse(date), dto);
    }

    @GetMapping("/{date}/stats")
    public DayStatsDto getStats(@PathVariable String date) {
        return dayService.getStats(LocalDate.parse(date));
    }
}
