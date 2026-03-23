package com.dailyplanner.controller;

import com.dailyplanner.dto.WeeklyGoalDto;
import com.dailyplanner.service.WeeklyGoalService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller celów tygodniowych.
 *
 * Endpointy:
 *   GET    /api/weekly-goals?weekStart=YYYY-MM-DD  — cele dla danego tygodnia
 *   POST   /api/weekly-goals                       — utwórz nowy cel tygodniowy
 *   PUT    /api/weekly-goals/{id}                  — zaktualizuj opis / achieved
 *   PATCH  /api/weekly-goals/{id}/toggle-achieved  — przełącz achieved
 *   DELETE /api/weekly-goals/{id}                  — usuń
 */
@RestController
@RequestMapping("/api/weekly-goals")
public class WeeklyGoalController {

    private final WeeklyGoalService service;

    public WeeklyGoalController(WeeklyGoalService service) {
        this.service = service;
    }

    /** Pobiera cele tygodniowe dla danego tygodnia (np. ?weekStart=2026-03-23) */
    @GetMapping
    public List<WeeklyGoalDto> getByWeek(@RequestParam String weekStart) {
        return service.getByWeek(weekStart);
    }

    /** Tworzy nowy cel tygodniowy */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public WeeklyGoalDto create(@RequestBody WeeklyGoalDto dto) {
        return service.create(dto);
    }

    /** Aktualizuje opis i/lub flagę achieved */
    @PutMapping("/{id}")
    public WeeklyGoalDto update(@PathVariable Long id, @RequestBody WeeklyGoalDto dto) {
        return service.update(id, dto);
    }

    /** Przełącza flagę achieved bez konieczności wysyłania pełnego body */
    @PatchMapping("/{id}/toggle-achieved")
    public WeeklyGoalDto toggleAchieved(@PathVariable Long id) {
        return service.toggleAchieved(id);
    }

    /** Usuwa cel tygodniowy; powiązane taski zachowują weeklyGoalId = null */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
