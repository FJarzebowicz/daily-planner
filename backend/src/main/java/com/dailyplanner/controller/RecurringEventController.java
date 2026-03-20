package com.dailyplanner.controller;

import com.dailyplanner.dto.RecurringEventDto;
import com.dailyplanner.service.RecurringEventService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
public class RecurringEventController {

    private final RecurringEventService service;

    public RecurringEventController(RecurringEventService service) {
        this.service = service;
    }

    @GetMapping("/days/{date}/recurring-events")
    public List<RecurringEventDto> getByDay(@PathVariable LocalDate date) {
        return service.getByDay(date);
    }

    @PostMapping("/days/{date}/recurring-events")
    @ResponseStatus(HttpStatus.CREATED)
    public RecurringEventDto create(@PathVariable LocalDate date, @Valid @RequestBody RecurringEventDto dto) {
        return service.create(date, dto);
    }

    @DeleteMapping("/recurring-events/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    @PostMapping("/days/{date}/recurring-events/copy-previous")
    public List<RecurringEventDto> copyFromPreviousDay(@PathVariable LocalDate date) {
        return service.copyFromPreviousDay(date);
    }
}
