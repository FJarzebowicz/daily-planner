package com.dailyplanner.repository;

import com.dailyplanner.entity.Thought;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ThoughtRepository extends JpaRepository<Thought, Long> {
    List<Thought> findByDayIdOrderByCreatedAtAsc(Long dayId);
}
