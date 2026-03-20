package com.dailyplanner.service;

import com.dailyplanner.dto.ShoppingItemDto;
import com.dailyplanner.entity.ShoppingItem;
import com.dailyplanner.entity.User;
import com.dailyplanner.exception.ResourceNotFoundException;
import com.dailyplanner.repository.ShoppingItemRepository;
import com.dailyplanner.security.SecurityUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ShoppingItemService {

    private final ShoppingItemRepository repository;

    public ShoppingItemService(ShoppingItemRepository repository) {
        this.repository = repository;
    }

    public List<ShoppingItemDto> getAll() {
        Long userId = SecurityUtil.getCurrentUserId();
        return repository.findByUserIdOrderByCategoryNameAscCreatedAtAsc(userId).stream()
                .map(ShoppingItemDto::from).toList();
    }

    @Transactional
    public ShoppingItemDto create(ShoppingItemDto dto) {
        User user = SecurityUtil.getCurrentUser();
        ShoppingItem item = new ShoppingItem();
        item.setUser(user);
        item.setName(dto.name());
        item.setCategoryName(dto.categoryName() != null ? dto.categoryName() : "Inne");
        item.setQuantity(dto.quantity());
        item.setUnit(dto.unit());
        return ShoppingItemDto.from(repository.save(item));
    }

    @Transactional
    public ShoppingItemDto update(Long id, ShoppingItemDto dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        ShoppingItem item = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Shopping item not found: " + id));
        item.setName(dto.name());
        item.setCategoryName(dto.categoryName() != null ? dto.categoryName() : "Inne");
        item.setQuantity(dto.quantity());
        item.setUnit(dto.unit());
        item.setBought(dto.bought());
        return ShoppingItemDto.from(repository.save(item));
    }

    @Transactional
    public ShoppingItemDto toggleBought(Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        ShoppingItem item = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Shopping item not found: " + id));
        item.setBought(!item.isBought());
        return ShoppingItemDto.from(repository.save(item));
    }

    @Transactional
    public void delete(Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        if (!repository.existsByIdAndUserId(id, userId)) {
            throw new ResourceNotFoundException("Shopping item not found: " + id);
        }
        repository.deleteByIdAndUserId(id, userId);
    }

    @Transactional
    public void deleteBought() {
        Long userId = SecurityUtil.getCurrentUserId();
        repository.deleteByUserIdAndIsBoughtTrue(userId);
    }
}
