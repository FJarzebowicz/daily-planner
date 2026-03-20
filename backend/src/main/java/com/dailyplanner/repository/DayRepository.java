package com.dailyplanner.repository;

import com.dailyplanner.entity.Day;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.Optional;

public interface DayRepository extends JpaRepository<Day, Long> {
    Optional<Day> findByUserIdAndDate(Long userId, LocalDate date);
}
