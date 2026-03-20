package com.dailyplanner.repository;

import com.dailyplanner.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByDayIdOrderBySortOrderAsc(Long dayId);
    List<Task> findByDayIdAndCategoryIdOrderBySortOrderAsc(Long dayId, Long categoryId);
    int countByDayIdAndCategoryId(Long dayId, Long categoryId);
}
