package com.dailyplanner.repository;

import com.dailyplanner.entity.RecurringEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface RecurringEventRepository extends JpaRepository<RecurringEvent, Long> {
    List<RecurringEvent> findByUserIdOrderByStartTimeAsc(Long userId);
    Optional<RecurringEvent> findByIdAndUserId(Long id, Long userId);
    boolean existsByIdAndUserId(Long id, Long userId);
    void deleteByIdAndUserId(Long id, Long userId);
}
