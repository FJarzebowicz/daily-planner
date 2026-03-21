package com.dailyplanner.service;

import com.dailyplanner.dto.BacklogTaskDto;
import com.dailyplanner.dto.TaskDto;
import com.dailyplanner.entity.BacklogTask;
import com.dailyplanner.entity.Priority;
import com.dailyplanner.entity.User;
import com.dailyplanner.exception.ResourceNotFoundException;
import com.dailyplanner.repository.BacklogTaskRepository;
import com.dailyplanner.security.SecurityUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class BacklogTaskService {

    private final BacklogTaskRepository repository;
    private final TaskService taskService;

    public BacklogTaskService(BacklogTaskRepository repository, TaskService taskService) {
        this.repository = repository;
        this.taskService = taskService;
    }

    public List<BacklogTaskDto> getAll() {
        Long userId = SecurityUtil.getCurrentUserId();
        return repository.findByUserIdOrderByCreatedAtAsc(userId).stream()
                .map(BacklogTaskDto::from).toList();
    }

    @Transactional
    public BacklogTaskDto create(BacklogTaskDto dto) {
        User user = SecurityUtil.getCurrentUser();
        BacklogTask task = new BacklogTask();
        task.setUser(user);
        task.setName(dto.name());
        task.setDescription(dto.description() != null ? dto.description() : "");
        task.setEstimatedMinutes(dto.estimatedMinutes());
        task.setPriority(Priority.valueOf(dto.priority().toUpperCase()));
        return BacklogTaskDto.from(repository.save(task));
    }

    @Transactional
    public void delete(Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        if (!repository.existsByIdAndUserId(id, userId)) {
            throw new ResourceNotFoundException("Backlog task not found: " + id);
        }
        repository.deleteByIdAndUserId(id, userId);
    }

    @Transactional
    public TaskDto moveToDay(Long backlogTaskId, String date, Long categoryId) {
        Long userId = SecurityUtil.getCurrentUserId();
        BacklogTask bt = repository.findByIdAndUserId(backlogTaskId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Backlog task not found: " + backlogTaskId));

        TaskDto taskDto = new TaskDto(
            null, null, categoryId, bt.getName(), bt.getDescription(),
            bt.getEstimatedMinutes(), bt.getPriority().name(), 0, false, null, null, null
        );
        TaskDto created = taskService.create(java.time.LocalDate.parse(date), taskDto);
        repository.delete(bt);
        return created;
    }
}
