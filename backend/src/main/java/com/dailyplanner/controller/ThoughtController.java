package com.dailyplanner.controller;

import com.dailyplanner.dto.ThoughtDto;
import com.dailyplanner.service.ThoughtService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
public class ThoughtController {

    private final ThoughtService thoughtService;

    public ThoughtController(ThoughtService thoughtService) {
        this.thoughtService = thoughtService;
    }

    @GetMapping("/days/{date}/thoughts")
    public List<ThoughtDto> getByDay(@PathVariable String date) {
        return thoughtService.getByDay(LocalDate.parse(date));
    }

    @PostMapping("/days/{date}/thoughts")
    @ResponseStatus(HttpStatus.CREATED)
    public ThoughtDto create(@PathVariable String date, @Valid @RequestBody ThoughtDto dto) {
        return thoughtService.create(LocalDate.parse(date), dto);
    }

    @DeleteMapping("/thoughts/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        thoughtService.delete(id);
    }
}
