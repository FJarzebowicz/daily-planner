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
public class MilestoneService {

    private final GoalRepository goalRepository;
    private final MilestoneRepository milestoneRepository;
    private final MilestoneHabitRepository milestoneHabitRepository;
    private final MilestoneTaskRepository milestoneTaskRepository;
    private final HabitRepository habitRepository;
    private final TaskRepository taskRepository;
    private final CategoryRepository categoryRepository;
    private final HabitCompletionRepository habitCompletionRepository;
    private final GoalService goalService;
    private final DayService dayService;

    public MilestoneService(GoalRepository goalRepository,
                            MilestoneRepository milestoneRepository,
                            MilestoneHabitRepository milestoneHabitRepository,
                            MilestoneTaskRepository milestoneTaskRepository,
                            HabitRepository habitRepository,
                            TaskRepository taskRepository,
                            CategoryRepository categoryRepository,
                            HabitCompletionRepository habitCompletionRepository,
                            GoalService goalService,
                            DayService dayService) {
        this.goalRepository = goalRepository;
        this.milestoneRepository = milestoneRepository;
        this.milestoneHabitRepository = milestoneHabitRepository;
        this.milestoneTaskRepository = milestoneTaskRepository;
        this.habitRepository = habitRepository;
        this.taskRepository = taskRepository;
        this.categoryRepository = categoryRepository;
        this.habitCompletionRepository = habitCompletionRepository;
        this.goalService = goalService;
        this.dayService = dayService;
    }

    @Transactional
    public MilestoneDto create(Long goalId, MilestoneDto dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        Goal goal = goalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found: " + goalId));

        Milestone milestone = new Milestone();
        milestone.setGoal(goal);
        milestone.setName(dto.name());
        milestone.setDescription(dto.description());
        if (dto.deadline() != null) {
            milestone.setDeadline(LocalDate.parse(dto.deadline()));
        }
        milestone.setSortOrder(dto.sortOrder());
        Milestone saved = milestoneRepository.save(milestone);
        return goalService.buildMilestoneDto(saved);
    }

    @Transactional
    public MilestoneDto update(Long goalId, Long milestoneId, MilestoneDto dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        goalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found: " + goalId));
        Milestone milestone = milestoneRepository.findByIdAndGoalId(milestoneId, goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone not found: " + milestoneId));

        milestone.setName(dto.name());
        milestone.setDescription(dto.description());
        milestone.setDeadline(dto.deadline() != null ? LocalDate.parse(dto.deadline()) : null);
        milestone.setSortOrder(dto.sortOrder());
        Milestone saved = milestoneRepository.save(milestone);
        return goalService.buildMilestoneDto(saved);
    }

    @Transactional
    public void delete(Long goalId, Long milestoneId) {
        Long userId = SecurityUtil.getCurrentUserId();
        goalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found: " + goalId));
        Milestone milestone = milestoneRepository.findByIdAndGoalId(milestoneId, goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone not found: " + milestoneId));
        milestoneRepository.delete(milestone);
    }

    @Transactional
    public MilestoneDto toggleComplete(Long goalId, Long milestoneId) {
        Long userId = SecurityUtil.getCurrentUserId();
        goalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found: " + goalId));
        Milestone milestone = milestoneRepository.findByIdAndGoalId(milestoneId, goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone not found: " + milestoneId));
        milestone.setCompleted(!milestone.isCompleted());
        Milestone saved = milestoneRepository.save(milestone);
        return goalService.buildMilestoneDto(saved);
    }

    @Transactional
    public MilestoneDto linkHabit(Long goalId, Long milestoneId, Long habitId) {
        Long userId = SecurityUtil.getCurrentUserId();
        goalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found: " + goalId));
        Milestone milestone = milestoneRepository.findByIdAndGoalId(milestoneId, goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone not found: " + milestoneId));
        Habit habit = habitRepository.findByIdAndUserId(habitId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Habit not found: " + habitId));

        if (!milestoneHabitRepository.existsByMilestoneIdAndHabitId(milestoneId, habitId)) {
            MilestoneHabit link = new MilestoneHabit();
            link.setMilestone(milestone);
            link.setHabit(habit);
            milestoneHabitRepository.save(link);
        }
        return goalService.buildMilestoneDto(milestone);
    }

    @Transactional
    public MilestoneDto linkTask(Long goalId, Long milestoneId, Long taskId) {
        Long userId = SecurityUtil.getCurrentUserId();
        goalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found: " + goalId));
        Milestone milestone = milestoneRepository.findByIdAndGoalId(milestoneId, goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone not found: " + milestoneId));
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + taskId));

        if (!milestoneTaskRepository.existsByMilestoneIdAndTaskId(milestoneId, taskId)) {
            MilestoneTask link = new MilestoneTask();
            link.setMilestone(milestone);
            link.setTask(task);
            milestoneTaskRepository.save(link);
        }
        return goalService.buildMilestoneDto(milestone);
    }

    @Transactional
    public MilestoneDto createAndLinkHabit(Long goalId, Long milestoneId, CreateHabitForGoalDto dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        User user = SecurityUtil.getCurrentUser();
        Goal goal = goalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found: " + goalId));
        Milestone milestone = milestoneRepository.findByIdAndGoalId(milestoneId, goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone not found: " + milestoneId));

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
        habit.setMilestone(milestone);
        if (dto.categoryId() != null) {
            Category category = categoryRepository.findByIdAndUserId(dto.categoryId(), userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + dto.categoryId()));
            habit.setCategory(category);
        }
        Habit savedHabit = habitRepository.save(habit);

        MilestoneHabit link = new MilestoneHabit();
        link.setMilestone(milestone);
        link.setHabit(savedHabit);
        milestoneHabitRepository.save(link);

        return goalService.buildMilestoneDto(milestone);
    }

    @Transactional
    public MilestoneDto createAndLinkTask(Long goalId, Long milestoneId, CreateTaskForGoalDto dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        Goal goal = goalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found: " + goalId));
        Milestone milestone = milestoneRepository.findByIdAndGoalId(milestoneId, goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone not found: " + milestoneId));

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
        task.setMilestone(milestone);
        Task savedTask = taskRepository.save(task);

        MilestoneTask link = new MilestoneTask();
        link.setMilestone(milestone);
        link.setTask(savedTask);
        milestoneTaskRepository.save(link);

        return goalService.buildMilestoneDto(milestone);
    }

    @Transactional
    public void unlinkHabit(Long goalId, Long milestoneId, Long habitId) {
        Long userId = SecurityUtil.getCurrentUserId();
        goalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found: " + goalId));
        milestoneRepository.findByIdAndGoalId(milestoneId, goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone not found: " + milestoneId));
        milestoneHabitRepository.deleteByMilestoneIdAndHabitId(milestoneId, habitId);
    }

    @Transactional
    public void unlinkTask(Long goalId, Long milestoneId, Long taskId) {
        Long userId = SecurityUtil.getCurrentUserId();
        goalRepository.findByIdAndUserId(goalId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found: " + goalId));
        milestoneRepository.findByIdAndGoalId(milestoneId, goalId)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone not found: " + milestoneId));
        milestoneTaskRepository.deleteByMilestoneIdAndTaskId(milestoneId, taskId);
    }
}
