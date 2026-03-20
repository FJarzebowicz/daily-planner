package com.dailyplanner.controller;

import com.dailyplanner.dto.HabitCompletionDto;
import com.dailyplanner.dto.HabitDto;
import com.dailyplanner.dto.HabitForDateDto;
import com.dailyplanner.dto.HabitStatsDto;
import com.dailyplanner.service.HabitService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/habits")
public class HabitController {

    private final HabitService service;

    public HabitController(HabitService service) {
        this.service = service;
    }

    @GetMapping
    public List<HabitDto> getAll() { return service.getAll(); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public HabitDto create(@Valid @RequestBody HabitDto dto) { return service.create(dto); }

    @PutMapping("/{id}")
    public HabitDto update(@PathVariable Long id, @Valid @RequestBody HabitDto dto) { return service.update(id, dto); }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) { service.delete(id); }

    @PutMapping("/{id}/pause")
    public HabitDto togglePause(@PathVariable Long id) { return service.togglePause(id); }

    @PostMapping("/{id}/complete/{date}")
    public HabitCompletionDto complete(@PathVariable Long id, @PathVariable String date) {
        return service.complete(id, LocalDate.parse(date));
    }

    @DeleteMapping("/{id}/complete/{date}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void uncomplete(@PathVariable Long id, @PathVariable String date) {
        service.uncomplete(id, LocalDate.parse(date));
    }

    @GetMapping("/{id}/stats")
    public HabitStatsDto getStats(@PathVariable Long id) { return service.getStats(id); }

    @GetMapping("/{id}/completions")
    public List<HabitCompletionDto> getCompletions(@PathVariable Long id,
            @RequestParam String from, @RequestParam String to) {
        return service.getCompletions(id, LocalDate.parse(from), LocalDate.parse(to));
    }

    @GetMapping("/for-date/{date}")
    public List<HabitForDateDto> getForDate(@PathVariable String date) {
        return service.getHabitsForDate(LocalDate.parse(date));
    }
}
