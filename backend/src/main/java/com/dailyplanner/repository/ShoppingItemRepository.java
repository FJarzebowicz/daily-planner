package com.dailyplanner.repository;

import com.dailyplanner.entity.ShoppingItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ShoppingItemRepository extends JpaRepository<ShoppingItem, Long> {
    List<ShoppingItem> findByUserIdOrderByCategoryNameAscCreatedAtAsc(Long userId);
    Optional<ShoppingItem> findByIdAndUserId(Long id, Long userId);
    boolean existsByIdAndUserId(Long id, Long userId);
    void deleteByIdAndUserId(Long id, Long userId);
    void deleteByUserIdAndBoughtTrue(Long userId);
}
