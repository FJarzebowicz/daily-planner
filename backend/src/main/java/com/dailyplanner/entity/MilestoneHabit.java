package com.dailyplanner.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "milestone_habits", uniqueConstraints = @UniqueConstraint(columnNames = {"milestone_id", "habit_id"}))
public class MilestoneHabit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "milestone_id", nullable = false)
    private Milestone milestone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "habit_id", nullable = false)
    private Habit habit;

    public MilestoneHabit() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Milestone getMilestone() { return milestone; }
    public void setMilestone(Milestone milestone) { this.milestone = milestone; }
    public Habit getHabit() { return habit; }
    public void setHabit(Habit habit) { this.habit = habit; }
}
