package com.dailyplanner.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "goal_master_task_habits", uniqueConstraints = @UniqueConstraint(columnNames = {"master_task_id", "habit_id"}))
public class GoalMasterTaskHabit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "master_task_id", nullable = false)
    private GoalMasterTask masterTask;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "habit_id", nullable = false)
    private Habit habit;

    public GoalMasterTaskHabit() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public GoalMasterTask getMasterTask() { return masterTask; }
    public void setMasterTask(GoalMasterTask masterTask) { this.masterTask = masterTask; }
    public Habit getHabit() { return habit; }
    public void setHabit(Habit habit) { this.habit = habit; }
}
