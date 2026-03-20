package com.dailyplanner.controller;

import com.dailyplanner.dto.RecurringEventDto;
import com.dailyplanner.service.RecurringEventService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recurring-events")
public class RecurringEventController {

    private final RecurringEventService service;

    public RecurringEventController(RecurringEventService service) {
        this.service = service;
    }

    @GetMapping
    public List<RecurringEventDto> getAll() {
        return service.getAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RecurringEventDto create(@Valid @RequestBody RecurringEventDto dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    public RecurringEventDto update(@PathVariable Long id, @Valid @RequestBody RecurringEventDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
