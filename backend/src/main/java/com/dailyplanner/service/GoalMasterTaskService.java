package com.dailyplanner.service;

import com.dailyplanner.dto.*;
import com.dailyplanner.entity.*;
import com.dailyplanner.exception.ResourceNotFoundException;
import com.dailyplanner.repository.*;
import com.dailyplanner.security.SecurityUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Service
public class GoalMasterTaskService {

    private final GoalRepository goalRepository;
    private final GoalMasterTaskRepository masterTaskRepository;
    private final GoalMasterTaskHabitRepository masterTaskHabitRepository;
    private final GoalMasterTaskTaskRepository masterTaskTaskRepository;
    private final HabitRepository habitRepository;
    private final TaskRepository taskRepository;
    private final CategoryRepository categoryRepository;
    private final HabitCompletionRepository habitCompletionRepository;
    private final DayService dayService;

    public GoalMasterTaskService(GoalRepository goalRepository,
                                  GoalMasterTaskRepository masterTaskRepository,
                                  GoalMasterTaskHabitRepository masterTaskHabitRepository,
                                  GoalMasterTaskTaskRepository masterTaskTaskRepository,
                                  HabitRepository habitRepository,
                                  TaskRepository taskRepository,
                                  CategoryRepository categoryRepository,
                                  HabitCompletionRepository habitCompletionRepository,
                                  DayService dayService) {
        this.goalRepository = goalRepository;
        this.masterTaskRepository = masterTaskRepository;
        this.masterTaskHabitRepository = masterTaskHabitRepository;
        this.masterTaskTaskRepository = masterTaskTaskRepository;
        this.habitRepository = habitRepository;
        this.taskRepository = taskRepository;
        this.categoryRepository = categoryRepository;
        this.habitCompletionRepository = habitCompletionRepository;
        this.dayService = dayService;
    }

    @Transactional
    public GoalMasterTaskDto createOrUpdate(Long goalId, GoalMasterTaskDto dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        Goal goal = goalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found: " + goalId));

        GoalMasterTask mt = masterTaskRepository.findByGoalId(goalId).orElseGet(() -> {
            GoalMasterTask newMt = new GoalMasterTask();
            newMt.setGoal(goal);
            return newMt;
        });
        mt.setName(dto.name());
        mt.setDescription(dto.description());
        GoalMasterTask saved = masterTaskRepository.save(mt);
        return buildDto(saved);
    }

    @Transactional
    public GoalMasterTaskDto linkHabit(Long goalId, Long habitId) {
        Long userId = SecurityUtil.getCurrentUserId();
        goalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found: " + goalId));
        GoalMasterTask mt = masterTaskRepository.findByGoalId(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Master task not found for goal: " + goalId));
        Habit habit = habitRepository.findByIdAndUserId(habitId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Habit not found: " + habitId));

        if (!masterTaskHabitRepository.existsByMasterTaskIdAndHabitId(mt.getId(), habitId)) {
            GoalMasterTaskHabit link = new GoalMasterTaskHabit();
            link.setMasterTask(mt);
            link.setHabit(habit);
            masterTaskHabitRepository.save(link);
        }
        return buildDto(mt);
    }

    @Transactional
    public GoalMasterTaskDto linkTask(Long goalId, Long taskId) {
        Long userId = SecurityUtil.getCurrentUserId();
        goalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found: " + goalId));
        GoalMasterTask mt = masterTaskRepository.findByGoalId(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Master task not found for goal: " + goalId));
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + taskId));

        if (!masterTaskTaskRepository.existsByMasterTaskIdAndTaskId(mt.getId(), taskId)) {
            GoalMasterTaskTask link = new GoalMasterTaskTask();
            link.setMasterTask(mt);
            link.setTask(task);
            masterTaskTaskRepository.save(link);
        }
        return buildDto(mt);
    }

    @Transactional
    public GoalMasterTaskDto createAndLinkHabit(Long goalId, CreateHabitForGoalDto dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        User user = SecurityUtil.getCurrentUser();
        Goal goal = goalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found: " + goalId));
        GoalMasterTask mt = masterTaskRepository.findByGoalId(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Master task not found for goal: " + goalId));

        Habit habit = new Habit();
        habit.setUser(user);
        habit.setName(dto.name());
        habit.setDescription(dto.description());
        habit.setScheduleType(dto.scheduleType() != null ? ScheduleType.valueOf(dto.scheduleType()) : ScheduleType.DAILY);
        habit.setScheduleDays(dto.scheduleDays());
        habit.setScheduleInterval(dto.scheduleInterval());
        habit.setStartDate(dto.startDate() != null ? LocalDate.parse(dto.startDate()) : LocalDate.now());
        habit.setActive(true);
        habit.setStreakGoal(dto.streakGoal());
        habit.setGoal(goal);
        if (dto.categoryId() != null) {
            Category category = categoryRepository.findByIdAndUserId(dto.categoryId(), userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + dto.categoryId()));
            habit.setCategory(category);
        }
        Habit savedHabit = habitRepository.save(habit);

        GoalMasterTaskHabit link = new GoalMasterTaskHabit();
        link.setMasterTask(mt);
        link.setHabit(savedHabit);
        masterTaskHabitRepository.save(link);

        return buildDto(mt);
    }

    @Transactional
    public GoalMasterTaskDto createAndLinkTask(Long goalId, CreateTaskForGoalDto dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        Goal goal = goalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found: " + goalId));
        GoalMasterTask mt = masterTaskRepository.findByGoalId(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Master task not found for goal: " + goalId));

        Category category = categoryRepository.findByIdAndUserId(dto.categoryId(), userId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + dto.categoryId()));

        LocalDate taskDate = dto.date() != null ? LocalDate.parse(dto.date()) : LocalDate.now();
        Day day = dayService.getOrCreateDay(taskDate);

        Task task = new Task();
        task.setDay(day);
        task.setTitle(dto.title());
        task.setDescription(dto.description() != null ? dto.description() : "");
        task.setCategory(category);
        task.setEstimatedMinutes(dto.estimatedMinutes());
        task.setPriority(dto.priority() != null ? Priority.valueOf(dto.priority().toUpperCase()) : Priority.MEDIUM);
        task.setGoal(goal);
        Task savedTask = taskRepository.save(task);

        GoalMasterTaskTask link = new GoalMasterTaskTask();
        link.setMasterTask(mt);
        link.setTask(savedTask);
        masterTaskTaskRepository.save(link);

        return buildDto(mt);
    }

    @Transactional
    public void unlinkHabit(Long goalId, Long habitId) {
        Long userId = SecurityUtil.getCurrentUserId();
        goalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found: " + goalId));
        GoalMasterTask mt = masterTaskRepository.findByGoalId(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Master task not found for goal: " + goalId));
        masterTaskHabitRepository.deleteByMasterTaskIdAndHabitId(mt.getId(), habitId);
    }

    @Transactional
    public void unlinkTask(Long goalId, Long taskId) {
        Long userId = SecurityUtil.getCurrentUserId();
        goalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found: " + goalId));
        GoalMasterTask mt = masterTaskRepository.findByGoalId(goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Master task not found for goal: " + goalId));
        masterTaskTaskRepository.deleteByMasterTaskIdAndTaskId(mt.getId(), taskId);
    }

    private GoalMasterTaskDto buildDto(GoalMasterTask mt) {
        LocalDate today = LocalDate.now();
        var habits = masterTaskHabitRepository.findByMasterTaskId(mt.getId()).stream()
                .map(mth -> {
                    Habit h = mth.getHabit();
                    Boolean completed = habitCompletionRepository.existsByHabitIdAndCompletedDate(h.getId(), today) ? true : null;
                    return LinkedHabitDto.from(h, completed);
                }).toList();
        var tasks = masterTaskTaskRepository.findByMasterTaskId(mt.getId()).stream()
                .map(mtt -> LinkedTaskDto.from(mtt.getTask())).toList();
        return GoalMasterTaskDto.from(mt, habits, tasks);
    }
}
