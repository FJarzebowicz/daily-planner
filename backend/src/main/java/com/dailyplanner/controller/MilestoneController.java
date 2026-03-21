package com.dailyplanner.controller;

import com.dailyplanner.dto.CreateHabitForGoalDto;
import com.dailyplanner.dto.CreateTaskForGoalDto;
import com.dailyplanner.dto.MilestoneDto;
import com.dailyplanner.service.MilestoneService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/goals/{goalId}/milestones")
public class MilestoneController {

    private final MilestoneService service;

    public MilestoneController(MilestoneService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MilestoneDto create(@PathVariable Long goalId, @Valid @RequestBody MilestoneDto dto) {
        return service.create(goalId, dto);
    }

    @PutMapping("/{milestoneId}")
    public MilestoneDto update(@PathVariable Long goalId, @PathVariable Long milestoneId,
                                @Valid @RequestBody MilestoneDto dto) {
        return service.update(goalId, milestoneId, dto);
    }

    @DeleteMapping("/{milestoneId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long goalId, @PathVariable Long milestoneId) {
        service.delete(goalId, milestoneId);
    }

    @PutMapping("/{milestoneId}/complete")
    public MilestoneDto toggleComplete(@PathVariable Long goalId, @PathVariable Long milestoneId) {
        return service.toggleComplete(goalId, milestoneId);
    }

    @PostMapping("/{milestoneId}/link-habit")
    public MilestoneDto linkHabit(@PathVariable Long goalId, @PathVariable Long milestoneId,
                                   @RequestBody Map<String, Long> body) {
        return service.linkHabit(goalId, milestoneId, body.get("habitId"));
    }

    @PostMapping("/{milestoneId}/link-task")
    public MilestoneDto linkTask(@PathVariable Long goalId, @PathVariable Long milestoneId,
                                  @RequestBody Map<String, Long> body) {
        return service.linkTask(goalId, milestoneId, body.get("taskId"));
    }

    @PostMapping("/{milestoneId}/create-habit")
    @ResponseStatus(HttpStatus.CREATED)
    public MilestoneDto createHabit(@PathVariable Long goalId, @PathVariable Long milestoneId,
                                     @Valid @RequestBody CreateHabitForGoalDto dto) {
        return service.createAndLinkHabit(goalId, milestoneId, dto);
    }

    @PostMapping("/{milestoneId}/create-task")
    @ResponseStatus(HttpStatus.CREATED)
    public MilestoneDto createTask(@PathVariable Long goalId, @PathVariable Long milestoneId,
                                    @Valid @RequestBody CreateTaskForGoalDto dto) {
        return service.createAndLinkTask(goalId, milestoneId, dto);
    }

    @DeleteMapping("/{milestoneId}/unlink-habit/{habitId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unlinkHabit(@PathVariable Long goalId, @PathVariable Long milestoneId,
                             @PathVariable Long habitId) {
        service.unlinkHabit(goalId, milestoneId, habitId);
    }

    @DeleteMapping("/{milestoneId}/unlink-task/{taskId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unlinkTask(@PathVariable Long goalId, @PathVariable Long milestoneId,
                            @PathVariable Long taskId) {
        service.unlinkTask(goalId, milestoneId, taskId);
    }
}
