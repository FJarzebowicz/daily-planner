package com.dailyplanner.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Cel tygodniowy — opisuje co użytkownik chce osiągnąć
 * w konkretnym tygodniu w ramach długoterminowego celu (Goal).
 *
 * Hierarchia: Goal → WeeklyGoal → Task (przez Task.weeklyGoalId)
 *
 * Jeden WeeklyGoal istnieje per (user, goal, weekStart).
 * weekStart to zawsze poniedziałek danego tygodnia (format YYYY-MM-DD).
 */
@Entity
@Table(
    name = "weekly_goals",
    uniqueConstraints = @UniqueConstraint(
        name = "uq_weekly_goal_user_goal_week",
        columnNames = {"user_id", "goal_id", "week_start"}
    )
)
public class WeeklyGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Właściciel — każdy weekly goal należy do konkretnego użytkownika */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Powiązany długoterminowy cel */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "goal_id", nullable = false)
    private Goal goal;

    /**
     * Data poniedziałku tygodnia.
     * Razem z (user_id, goal_id) tworzy unikalny klucz.
     */
    @Column(name = "week_start", nullable = false)
    private LocalDate weekStart;

    /** Co użytkownik planuje zrobić w tym tygodniu w ramach celu */
    @Column(nullable = false, columnDefinition = "TEXT")
    private String description = "";

    /** Czy użytkownik ocenił, że przybliżył się do celu w tym tygodniu */
    @Column(nullable = false)
    private boolean achieved = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public WeeklyGoal() {}

    // ── Getters & Setters ──

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Goal getGoal() { return goal; }
    public void setGoal(Goal goal) { this.goal = goal; }

    public LocalDate getWeekStart() { return weekStart; }
    public void setWeekStart(LocalDate weekStart) { this.weekStart = weekStart; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isAchieved() { return achieved; }
    public void setAchieved(boolean achieved) { this.achieved = achieved; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
