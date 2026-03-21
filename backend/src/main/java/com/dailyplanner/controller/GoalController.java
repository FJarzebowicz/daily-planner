package com.dailyplanner.controller;

import com.dailyplanner.dto.GoalDetailDto;
import com.dailyplanner.dto.GoalDto;
import com.dailyplanner.service.GoalService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/goals")
public class GoalController {

    private final GoalService service;

    public GoalController(GoalService service) {
        this.service = service;
    }

    @GetMapping
    public List<GoalDto> getAll() { return service.getAll(); }

    @GetMapping("/{id}")
    public GoalDetailDto getById(@PathVariable Long id) { return service.getById(id); }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GoalDto create(@Valid @RequestBody GoalDto dto) { return service.create(dto); }

    @PutMapping("/{id}")
    public GoalDto update(@PathVariable Long id, @Valid @RequestBody GoalDto dto) { return service.update(id, dto); }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) { service.delete(id); }

    @PutMapping("/{id}/status")
    public GoalDto updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return service.updateStatus(id, body.get("status"));
    }
}
