package com.dailyplanner.service;

import com.dailyplanner.dto.ShoppingCategoryDto;
import com.dailyplanner.entity.ShoppingCategory;
import com.dailyplanner.entity.User;
import com.dailyplanner.exception.ResourceNotFoundException;
import com.dailyplanner.repository.ShoppingCategoryRepository;
import com.dailyplanner.security.SecurityUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ShoppingCategoryService {

    private static final List<String> DEFAULT_NAMES = List.of(
            "Nabiał", "Warzywa i owoce", "Mięso i ryby", "Pieczywo",
            "Napoje", "Chemia", "Przekąski", "Inne"
    );

    private final ShoppingCategoryRepository repository;

    public ShoppingCategoryService(ShoppingCategoryRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public List<ShoppingCategoryDto> getAll() {
        User user = SecurityUtil.getCurrentUser();
        if (!repository.existsByUserId(user.getId())) {
            seedDefaults(user);
        }
        return repository.findByUserIdOrderByNameAsc(user.getId()).stream()
                .map(ShoppingCategoryDto::from).toList();
    }

    private void seedDefaults(User user) {
        for (String name : DEFAULT_NAMES) {
            ShoppingCategory cat = new ShoppingCategory();
            cat.setUser(user);
            cat.setName(name);
            repository.save(cat);
        }
    }

    @Transactional
    public ShoppingCategoryDto create(ShoppingCategoryDto dto) {
        User user = SecurityUtil.getCurrentUser();
        ShoppingCategory cat = new ShoppingCategory();
        cat.setUser(user);
        cat.setName(dto.name());
        return ShoppingCategoryDto.from(repository.save(cat));
    }

    @Transactional
    public ShoppingCategoryDto update(Long id, ShoppingCategoryDto dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        ShoppingCategory cat = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Shopping category not found: " + id));
        cat.setName(dto.name());
        return ShoppingCategoryDto.from(repository.save(cat));
    }

    @Transactional
    public void delete(Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        if (!repository.existsByIdAndUserId(id, userId)) {
            throw new ResourceNotFoundException("Shopping category not found: " + id);
        }
        repository.deleteByIdAndUserId(id, userId);
    }
}
