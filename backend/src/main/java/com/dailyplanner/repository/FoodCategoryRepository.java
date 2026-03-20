package com.dailyplanner.repository;

import com.dailyplanner.entity.FoodCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FoodCategoryRepository extends JpaRepository<FoodCategory, Long> {
    List<FoodCategory> findByUserIdOrderByNameAsc(Long userId);
    Optional<FoodCategory> findByIdAndUserId(Long id, Long userId);
    boolean existsByUserId(Long userId);
    boolean existsByIdAndUserId(Long id, Long userId);
    void deleteByIdAndUserId(Long id, Long userId);
}
