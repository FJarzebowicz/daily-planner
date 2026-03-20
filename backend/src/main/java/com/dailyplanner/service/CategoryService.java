package com.dailyplanner.service;

import com.dailyplanner.dto.CategoryDto;
import com.dailyplanner.entity.Category;
import com.dailyplanner.entity.User;
import com.dailyplanner.exception.ResourceNotFoundException;
import com.dailyplanner.repository.CategoryRepository;
import com.dailyplanner.security.SecurityUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<CategoryDto> getAll() {
        Long userId = SecurityUtil.getCurrentUserId();
        return categoryRepository.findByUserIdOrderBySortOrderAsc(userId).stream()
                .map(CategoryDto::from).toList();
    }

    @Transactional
    public CategoryDto create(CategoryDto dto) {
        User user = SecurityUtil.getCurrentUser();
        Category cat = new Category();
        cat.setUser(user);
        cat.setName(dto.name());
        cat.setColor(dto.color());
        cat.setSortOrder(dto.sortOrder());
        return CategoryDto.from(categoryRepository.save(cat));
    }

    @Transactional
    public CategoryDto update(Long id, CategoryDto dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        Category cat = categoryRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + id));
        if (dto.name() != null) cat.setName(dto.name());
        if (dto.color() != null) cat.setColor(dto.color());
        cat.setSortOrder(dto.sortOrder());
        return CategoryDto.from(categoryRepository.save(cat));
    }

    @Transactional
    public void delete(Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        if (!categoryRepository.existsByIdAndUserId(id, userId)) {
            throw new ResourceNotFoundException("Category not found: " + id);
        }
        categoryRepository.deleteByIdAndUserId(id, userId);
    }
}
