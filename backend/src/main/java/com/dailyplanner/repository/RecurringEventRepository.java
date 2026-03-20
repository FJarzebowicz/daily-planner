package com.dailyplanner.repository;

import com.dailyplanner.entity.RecurringEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface RecurringEventRepository extends JpaRepository<RecurringEvent, Long> {
    List<RecurringEvent> findByDayIdOrderByStartTimeAsc(Long dayId);
    Optional<RecurringEvent> findByIdAndDayId(Long id, Long dayId);
    boolean existsByIdAndDayId(Long id, Long dayId);
    void deleteByIdAndDayId(Long id, Long dayId);
}
