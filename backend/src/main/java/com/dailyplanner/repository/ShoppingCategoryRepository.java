package com.dailyplanner.repository;

import com.dailyplanner.entity.ShoppingCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ShoppingCategoryRepository extends JpaRepository<ShoppingCategory, Long> {
    List<ShoppingCategory> findByUserIdOrderByNameAsc(Long userId);
    Optional<ShoppingCategory> findByIdAndUserId(Long id, Long userId);
    boolean existsByIdAndUserId(Long id, Long userId);
    void deleteByIdAndUserId(Long id, Long userId);
}
