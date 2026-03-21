package com.dailyplanner.controller;

import com.dailyplanner.dto.CreateHabitForGoalDto;
import com.dailyplanner.dto.CreateTaskForGoalDto;
import com.dailyplanner.dto.GoalMasterTaskDto;
import com.dailyplanner.service.GoalMasterTaskService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/goals/{goalId}/master-task")
public class GoalMasterTaskController {

    private final GoalMasterTaskService service;

    public GoalMasterTaskController(GoalMasterTaskService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public GoalMasterTaskDto createOrUpdate(@PathVariable Long goalId, @Valid @RequestBody GoalMasterTaskDto dto) {
        return service.createOrUpdate(goalId, dto);
    }

    @PostMapping("/link-habit")
    public GoalMasterTaskDto linkHabit(@PathVariable Long goalId, @RequestBody Map<String, Long> body) {
        return service.linkHabit(goalId, body.get("habitId"));
    }

    @PostMapping("/link-task")
    public GoalMasterTaskDto linkTask(@PathVariable Long goalId, @RequestBody Map<String, Long> body) {
        return service.linkTask(goalId, body.get("taskId"));
    }

    @PostMapping("/create-habit")
    @ResponseStatus(HttpStatus.CREATED)
    public GoalMasterTaskDto createHabit(@PathVariable Long goalId, @Valid @RequestBody CreateHabitForGoalDto dto) {
        return service.createAndLinkHabit(goalId, dto);
    }

    @PostMapping("/create-task")
    @ResponseStatus(HttpStatus.CREATED)
    public GoalMasterTaskDto createTask(@PathVariable Long goalId, @Valid @RequestBody CreateTaskForGoalDto dto) {
        return service.createAndLinkTask(goalId, dto);
    }

    @DeleteMapping("/unlink-habit/{habitId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unlinkHabit(@PathVariable Long goalId, @PathVariable Long habitId) {
        service.unlinkHabit(goalId, habitId);
    }

    @DeleteMapping("/unlink-task/{taskId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unlinkTask(@PathVariable Long goalId, @PathVariable Long taskId) {
        service.unlinkTask(goalId, taskId);
    }
}
