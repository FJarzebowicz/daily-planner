package com.dailyplanner.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "milestone_tasks", uniqueConstraints = @UniqueConstraint(columnNames = {"milestone_id", "task_id"}))
public class MilestoneTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "milestone_id", nullable = false)
    private Milestone milestone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    public MilestoneTask() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Milestone getMilestone() { return milestone; }
    public void setMilestone(Milestone milestone) { this.milestone = milestone; }
    public Task getTask() { return task; }
    public void setTask(Task task) { this.task = task; }
}
