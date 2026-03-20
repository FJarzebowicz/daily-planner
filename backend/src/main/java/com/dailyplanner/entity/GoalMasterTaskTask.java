package com.dailyplanner.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "goal_master_task_tasks", uniqueConstraints = @UniqueConstraint(columnNames = {"master_task_id", "task_id"}))
public class GoalMasterTaskTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "master_task_id", nullable = false)
    private GoalMasterTask masterTask;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    public GoalMasterTaskTask() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public GoalMasterTask getMasterTask() { return masterTask; }
    public void setMasterTask(GoalMasterTask masterTask) { this.masterTask = masterTask; }
    public Task getTask() { return task; }
    public void setTask(Task task) { this.task = task; }
}
