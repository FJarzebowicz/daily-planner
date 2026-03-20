package com.dailyplanner.controller;

import com.dailyplanner.dto.BacklogTaskDto;
import com.dailyplanner.dto.TaskDto;
import com.dailyplanner.service.BacklogTaskService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/backlog")
public class BacklogTaskController {

    private final BacklogTaskService service;

    public BacklogTaskController(BacklogTaskService service) {
        this.service = service;
    }

    @GetMapping
    public List<BacklogTaskDto> getAll() {
        return service.getAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BacklogTaskDto create(@Valid @RequestBody BacklogTaskDto dto) {
        return service.create(dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    @PostMapping("/{id}/move-to-day")
    public TaskDto moveToDay(
            @PathVariable Long id,
            @RequestParam String date,
            @RequestParam Long categoryId) {
        return service.moveToDay(id, date, categoryId);
    }
}
