package com.dailyplanner.repository;

import com.dailyplanner.entity.Food;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FoodRepository extends JpaRepository<Food, Long> {
    List<Food> findByUserIdOrderByNameAsc(Long userId);
    List<Food> findByUserIdAndCategoryIdOrderByNameAsc(Long userId, Long categoryId);
    Optional<Food> findByIdAndUserId(Long id, Long userId);
    boolean existsByIdAndUserId(Long id, Long userId);
    void deleteByIdAndUserId(Long id, Long userId);
    List<Food> findByUserIdAndNameContainingIgnoreCaseOrderByNameAsc(Long userId, String name);
}
