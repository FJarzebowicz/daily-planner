package com.dailyplanner.service;

import com.dailyplanner.dto.ReorderRequest;
import com.dailyplanner.dto.TaskDto;
import com.dailyplanner.entity.*;
import com.dailyplanner.exception.DayClosedException;
import com.dailyplanner.exception.ResourceNotFoundException;
import com.dailyplanner.repository.CategoryRepository;
import com.dailyplanner.repository.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final CategoryRepository categoryRepository;
    private final DayService dayService;

    public TaskService(TaskRepository taskRepository, CategoryRepository categoryRepository, DayService dayService) {
        this.taskRepository = taskRepository;
        this.categoryRepository = categoryRepository;
        this.dayService = dayService;
    }

    public List<TaskDto> getByDay(LocalDate date) {
        Day day = dayService.getOrCreateDay(date);
        return taskRepository.findByDayIdOrderBySortOrderAsc(day.getId()).stream()
                .map(TaskDto::from).toList();
    }

    @Transactional
    public TaskDto create(LocalDate date, TaskDto dto) {
        Day day = dayService.getOrCreateDay(date);
        if (day.isClosed()) throw new DayClosedException();

        Category category = categoryRepository.findById(dto.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + dto.categoryId()));

        int nextOrder = taskRepository.countByDayIdAndCategoryId(day.getId(), category.getId());

        Task task = new Task();
        task.setDay(day);
        task.setCategory(category);
        task.setTitle(dto.title());
        task.setDescription(dto.description() != null ? dto.description() : "");
        task.setEstimatedMinutes(dto.estimatedMinutes());
        task.setPriority(Priority.valueOf(dto.priority().toUpperCase()));
        task.setSortOrder(nextOrder);

        return TaskDto.from(taskRepository.save(task));
    }

    @Transactional
    public TaskDto update(Long id, TaskDto dto) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + id));
        if (task.getDay().isClosed()) throw new DayClosedException();

        if (dto.title() != null) task.setTitle(dto.title());
        if (dto.description() != null) task.setDescription(dto.description());
        task.setEstimatedMinutes(dto.estimatedMinutes());
        if (dto.priority() != null) task.setPriority(Priority.valueOf(dto.priority().toUpperCase()));
        if (dto.categoryId() != null) {
            Category cat = categoryRepository.findById(dto.categoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + dto.categoryId()));
            task.setCategory(cat);
        }

        return TaskDto.from(taskRepository.save(task));
    }

    @Transactional
    public TaskDto toggle(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + id));
        if (task.getDay().isClosed()) throw new DayClosedException();
        task.setCompleted(!task.isCompleted());
        return TaskDto.from(taskRepository.save(task));
    }

    @Transactional
    public void delete(Long id) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + id));
        if (task.getDay().isClosed()) throw new DayClosedException();
        taskRepository.delete(task);
    }

    @Transactional
    public void reorder(ReorderRequest request) {
        List<Long> ids = request.taskIds();
        for (int i = 0; i < ids.size(); i++) {
            Task task = taskRepository.findById(ids.get(i))
                    .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
            task.setSortOrder(i);
            taskRepository.save(task);
        }
    }
}
