package com.dailyplanner.service;

import com.dailyplanner.dto.FoodCategoryDto;
import com.dailyplanner.entity.FoodCategory;
import com.dailyplanner.entity.User;
import com.dailyplanner.exception.ResourceNotFoundException;
import com.dailyplanner.repository.FoodCategoryRepository;
import com.dailyplanner.security.SecurityUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FoodCategoryService {

    private static final List<String> DEFAULT_NAMES = List.of(
            "Śniadania", "Obiady", "Kolacje", "Przekąski", "Desery", "Napoje"
    );

    private final FoodCategoryRepository repository;

    public FoodCategoryService(FoodCategoryRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public List<FoodCategoryDto> getAll() {
        User user = SecurityUtil.getCurrentUser();
        if (!repository.existsByUserId(user.getId())) {
            seedDefaults(user);
        }
        return repository.findByUserIdOrderByNameAsc(user.getId()).stream()
                .map(FoodCategoryDto::from).toList();
    }

    private void seedDefaults(User user) {
        for (String name : DEFAULT_NAMES) {
            FoodCategory cat = new FoodCategory();
            cat.setUser(user);
            cat.setName(name);
            repository.save(cat);
        }
    }

    @Transactional
    public FoodCategoryDto create(FoodCategoryDto dto) {
        User user = SecurityUtil.getCurrentUser();
        FoodCategory cat = new FoodCategory();
        cat.setUser(user);
        cat.setName(dto.name());
        return FoodCategoryDto.from(repository.save(cat));
    }

    @Transactional
    public FoodCategoryDto update(Long id, FoodCategoryDto dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        FoodCategory cat = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Food category not found: " + id));
        cat.setName(dto.name());
        return FoodCategoryDto.from(repository.save(cat));
    }

    @Transactional
    public void delete(Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        if (!repository.existsByIdAndUserId(id, userId)) {
            throw new ResourceNotFoundException("Food category not found: " + id);
        }
        repository.deleteByIdAndUserId(id, userId);
    }
}
