package com.dailyplanner.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "meals", uniqueConstraints = @UniqueConstraint(columnNames = {"day_id", "slot"}))
public class Meal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "day_id", nullable = false)
    private Day day;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MealSlot slot;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description = "";

    @Column(name = "is_eaten", nullable = false)
    private boolean eaten = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public Meal() {}

    public Meal(Day day, MealSlot slot) {
        this.day = day;
        this.slot = slot;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Day getDay() { return day; }
    public void setDay(Day day) { this.day = day; }

    public MealSlot getSlot() { return slot; }
    public void setSlot(MealSlot slot) { this.slot = slot; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public boolean isEaten() { return eaten; }
    public void setEaten(boolean eaten) { this.eaten = eaten; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
