package com.dailyplanner.repository;

import com.dailyplanner.entity.BacklogTask;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface BacklogTaskRepository extends JpaRepository<BacklogTask, Long> {
    List<BacklogTask> findByUserIdOrderByCreatedAtAsc(Long userId);
    Optional<BacklogTask> findByIdAndUserId(Long id, Long userId);
    boolean existsByIdAndUserId(Long id, Long userId);
    void deleteByIdAndUserId(Long id, Long userId);
}
