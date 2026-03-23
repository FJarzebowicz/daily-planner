package com.dailyplanner.controller;

import com.dailyplanner.dto.GlobalOrderRequest;
import com.dailyplanner.dto.ReorderRequest;
import com.dailyplanner.dto.SwapResponse;
import com.dailyplanner.dto.TaskDto;
import java.util.Map;
import com.dailyplanner.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping("/days/{date}/tasks")
    public List<TaskDto> getByDay(@PathVariable String date) {
        return taskService.getByDay(LocalDate.parse(date));
    }

    @PostMapping("/days/{date}/tasks")
    @ResponseStatus(HttpStatus.CREATED)
    public TaskDto create(@PathVariable String date, @Valid @RequestBody TaskDto dto) {
        return taskService.create(LocalDate.parse(date), dto);
    }

    @PutMapping("/tasks/{id}")
    public TaskDto update(@PathVariable Long id, @Valid @RequestBody TaskDto dto) {
        return taskService.update(id, dto);
    }

    @PatchMapping("/tasks/{id}/toggle")
    public TaskDto toggle(@PathVariable Long id) {
        return taskService.toggle(id);
    }

    @DeleteMapping("/tasks/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        taskService.delete(id);
    }

    /**
     * Przypisuje lub odpina cel tygodniowy od taska.
     * Body: {"weeklyGoalId": 5} lub {"weeklyGoalId": null}
     */
    @PatchMapping("/tasks/{id}/weekly-goal")
    public TaskDto assignWeeklyGoal(@PathVariable Long id, @RequestBody Map<String, Long> body) {
        Long weeklyGoalId = body.get("weeklyGoalId");
        return taskService.assignWeeklyGoal(id, weeklyGoalId);
    }

    @PatchMapping("/tasks/{id}/global-order")
    public SwapResponse setGlobalOrder(@PathVariable Long id, @RequestBody GlobalOrderRequest request) {
        return taskService.setGlobalOrder(id, request);
    }

    @PatchMapping("/tasks/reorder")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reorder(@Valid @RequestBody ReorderRequest request) {
        taskService.reorder(request);
    }
}
