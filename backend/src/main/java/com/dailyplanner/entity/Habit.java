package com.dailyplanner.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "habits")
public class Habit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "schedule_type", nullable = false)
    private ScheduleType scheduleType = ScheduleType.DAILY;

    @Column(name = "schedule_days", length = 100)
    private String scheduleDays;

    @Column(name = "schedule_interval")
    private Integer scheduleInterval;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "streak_goal")
    private Integer streakGoal;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Habit() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public ScheduleType getScheduleType() { return scheduleType; }
    public void setScheduleType(ScheduleType scheduleType) { this.scheduleType = scheduleType; }
    public String getScheduleDays() { return scheduleDays; }
    public void setScheduleDays(String scheduleDays) { this.scheduleDays = scheduleDays; }
    public Integer getScheduleInterval() { return scheduleInterval; }
    public void setScheduleInterval(Integer scheduleInterval) { this.scheduleInterval = scheduleInterval; }
    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Integer getStreakGoal() { return streakGoal; }
    public void setStreakGoal(Integer streakGoal) { this.streakGoal = streakGoal; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
