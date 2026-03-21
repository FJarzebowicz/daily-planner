package com.dailyplanner.service;

import com.dailyplanner.dto.*;
import com.dailyplanner.entity.*;
import com.dailyplanner.exception.ResourceNotFoundException;
import com.dailyplanner.repository.*;
import com.dailyplanner.security.SecurityUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class GoalService {

    private final GoalRepository goalRepository;
    private final MilestoneRepository milestoneRepository;
    private final GoalMasterTaskRepository masterTaskRepository;
    private final MilestoneHabitRepository milestoneHabitRepository;
    private final MilestoneTaskRepository milestoneTaskRepository;
    private final GoalMasterTaskHabitRepository masterTaskHabitRepository;
    private final GoalMasterTaskTaskRepository masterTaskTaskRepository;
    private final HabitCompletionRepository habitCompletionRepository;

    public GoalService(GoalRepository goalRepository,
                       MilestoneRepository milestoneRepository,
                       GoalMasterTaskRepository masterTaskRepository,
                       MilestoneHabitRepository milestoneHabitRepository,
                       MilestoneTaskRepository milestoneTaskRepository,
                       GoalMasterTaskHabitRepository masterTaskHabitRepository,
                       GoalMasterTaskTaskRepository masterTaskTaskRepository,
                       HabitCompletionRepository habitCompletionRepository) {
        this.goalRepository = goalRepository;
        this.milestoneRepository = milestoneRepository;
        this.masterTaskRepository = masterTaskRepository;
        this.milestoneHabitRepository = milestoneHabitRepository;
        this.milestoneTaskRepository = milestoneTaskRepository;
        this.masterTaskHabitRepository = masterTaskHabitRepository;
        this.masterTaskTaskRepository = masterTaskTaskRepository;
        this.habitCompletionRepository = habitCompletionRepository;
    }

    public List<GoalDto> getAll() {
        Long userId = SecurityUtil.getCurrentUserId();
        return goalRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(g -> {
                    int total = milestoneRepository.countByGoalId(g.getId());
                    int completed = milestoneRepository.countByGoalIdAndCompletedTrue(g.getId());
                    return GoalDto.from(g, total, completed);
                }).toList();
    }

    public GoalDetailDto getById(Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        Goal goal = goalRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found: " + id));

        int totalMilestones = milestoneRepository.countByGoalId(id);
        int completedMilestones = milestoneRepository.countByGoalIdAndCompletedTrue(id);

        GoalMasterTaskDto masterTaskDto = masterTaskRepository.findByGoalId(id)
                .map(this::buildMasterTaskDto)
                .orElse(null);

        List<MilestoneDto> milestoneDtos = milestoneRepository.findByGoalIdOrderBySortOrderAsc(id).stream()
                .map(this::buildMilestoneDto)
                .toList();

        return GoalDetailDto.from(goal, totalMilestones, completedMilestones, masterTaskDto, milestoneDtos);
    }

    @Transactional
    public GoalDto create(GoalDto dto) {
        User user = SecurityUtil.getCurrentUser();
        Goal goal = new Goal();
        goal.setUser(user);
        goal.setName(dto.name());
        goal.setDescription(dto.description());
        goal.setRules(dto.rules());
        if (dto.deadline() != null) {
            goal.setDeadline(LocalDate.parse(dto.deadline()));
        }
        if (dto.status() != null) {
            goal.setStatus(GoalStatus.valueOf(dto.status()));
        }
        Goal saved = goalRepository.save(goal);
        return GoalDto.from(saved, 0, 0);
    }

    @Transactional
    public GoalDto update(Long id, GoalDto dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        Goal goal = goalRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found: " + id));
        goal.setName(dto.name());
        goal.setDescription(dto.description());
        goal.setRules(dto.rules());
        goal.setDeadline(dto.deadline() != null ? LocalDate.parse(dto.deadline()) : null);
        if (dto.status() != null) {
            goal.setStatus(GoalStatus.valueOf(dto.status()));
        }
        Goal saved = goalRepository.save(goal);
        int total = milestoneRepository.countByGoalId(id);
        int completed = milestoneRepository.countByGoalIdAndCompletedTrue(id);
        return GoalDto.from(saved, total, completed);
    }

    @Transactional
    public void delete(Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        if (!goalRepository.existsByIdAndUserId(id, userId)) {
            throw new ResourceNotFoundException("Goal not found: " + id);
        }
        goalRepository.deleteByIdAndUserId(id, userId);
    }

    @Transactional
    public GoalDto updateStatus(Long id, String status) {
        Long userId = SecurityUtil.getCurrentUserId();
        Goal goal = goalRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Goal not found: " + id));
        goal.setStatus(GoalStatus.valueOf(status));
        Goal saved = goalRepository.save(goal);
        int total = milestoneRepository.countByGoalId(id);
        int completed = milestoneRepository.countByGoalIdAndCompletedTrue(id);
        return GoalDto.from(saved, total, completed);
    }

    private GoalMasterTaskDto buildMasterTaskDto(GoalMasterTask mt) {
        LocalDate today = LocalDate.now();
        List<LinkedHabitDto> habits = masterTaskHabitRepository.findByMasterTaskId(mt.getId()).stream()
                .map(mth -> {
                    Habit h = mth.getHabit();
                    Boolean completed = habitCompletionRepository.existsByHabitIdAndCompletedDate(h.getId(), today) ? true : null;
                    return LinkedHabitDto.from(h, completed);
                }).toList();
        List<LinkedTaskDto> tasks = masterTaskTaskRepository.findByMasterTaskId(mt.getId()).stream()
                .map(mtt -> LinkedTaskDto.from(mtt.getTask())).toList();
        return GoalMasterTaskDto.from(mt, habits, tasks);
    }

    MilestoneDto buildMilestoneDto(Milestone m) {
        LocalDate today = LocalDate.now();
        List<LinkedHabitDto> habits = milestoneHabitRepository.findByMilestoneId(m.getId()).stream()
                .map(mh -> {
                    Habit h = mh.getHabit();
                    Boolean completed = habitCompletionRepository.existsByHabitIdAndCompletedDate(h.getId(), today) ? true : null;
                    return LinkedHabitDto.from(h, completed);
                }).toList();
        List<LinkedTaskDto> tasks = milestoneTaskRepository.findByMilestoneId(m.getId()).stream()
                .map(mt -> LinkedTaskDto.from(mt.getTask())).toList();
        return MilestoneDto.from(m, habits, tasks);
    }
}
