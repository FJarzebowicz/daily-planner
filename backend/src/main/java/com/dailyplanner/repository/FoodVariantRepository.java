package com.dailyplanner.repository;

import com.dailyplanner.entity.FoodVariant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FoodVariantRepository extends JpaRepository<FoodVariant, Long> {
    List<FoodVariant> findByFoodIdOrderByNameAsc(Long foodId);
    Optional<FoodVariant> findByIdAndFoodId(Long id, Long foodId);
    void deleteByIdAndFoodId(Long id, Long foodId);
}
