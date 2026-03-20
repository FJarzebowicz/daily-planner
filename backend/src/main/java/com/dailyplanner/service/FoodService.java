package com.dailyplanner.service;

import com.dailyplanner.dto.FoodDto;
import com.dailyplanner.dto.FoodVariantDto;
import com.dailyplanner.entity.Food;
import com.dailyplanner.entity.FoodCategory;
import com.dailyplanner.entity.User;
import com.dailyplanner.exception.ResourceNotFoundException;
import com.dailyplanner.repository.FoodCategoryRepository;
import com.dailyplanner.repository.FoodRepository;
import com.dailyplanner.repository.FoodVariantRepository;
import com.dailyplanner.security.SecurityUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FoodService {

    private final FoodRepository repository;
    private final FoodCategoryRepository categoryRepository;
    private final FoodVariantRepository variantRepository;

    public FoodService(FoodRepository repository, FoodCategoryRepository categoryRepository,
                       FoodVariantRepository variantRepository) {
        this.repository = repository;
        this.categoryRepository = categoryRepository;
        this.variantRepository = variantRepository;
    }

    @Transactional(readOnly = true)
    public List<FoodDto> getAll(Long categoryId) {
        Long userId = SecurityUtil.getCurrentUserId();
        if (categoryId != null) {
            return repository.findByUserIdAndCategoryIdOrderByNameAsc(userId, categoryId).stream()
                    .map(FoodDto::from).toList();
        }
        return repository.findByUserIdOrderByNameAsc(userId).stream()
                .map(FoodDto::from).toList();
    }

    @Transactional(readOnly = true)
    public FoodDto getById(Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        Food food = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Food not found: " + id));
        List<FoodVariantDto> variants = variantRepository.findByFoodIdOrderByNameAsc(food.getId()).stream()
                .map(FoodVariantDto::from).toList();
        return FoodDto.fromWithVariants(food, variants);
    }

    @Transactional
    public FoodDto create(FoodDto dto) {
        User user = SecurityUtil.getCurrentUser();
        Food food = new Food();
        food.setUser(user);
        food.setName(dto.name());
        food.setDescription(dto.description());
        food.setLink(dto.link());
        resolveCategory(food, dto.categoryId(), user.getId());
        return FoodDto.from(repository.save(food));
    }

    @Transactional
    public FoodDto update(Long id, FoodDto dto) {
        Long userId = SecurityUtil.getCurrentUserId();
        Food food = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Food not found: " + id));
        food.setName(dto.name());
        food.setDescription(dto.description());
        food.setLink(dto.link());
        resolveCategory(food, dto.categoryId(), userId);
        return FoodDto.from(repository.save(food));
    }

    @Transactional
    public FoodDto updateImageUrl(Long id, String imageUrl) {
        Long userId = SecurityUtil.getCurrentUserId();
        Food food = repository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Food not found: " + id));
        food.setImageUrl(imageUrl);
        return FoodDto.from(repository.save(food));
    }

    @Transactional
    public void delete(Long id) {
        Long userId = SecurityUtil.getCurrentUserId();
        if (!repository.existsByIdAndUserId(id, userId)) {
            throw new ResourceNotFoundException("Food not found: " + id);
        }
        repository.deleteByIdAndUserId(id, userId);
    }

    @Transactional(readOnly = true)
    public List<FoodDto> search(String query) {
        Long userId = SecurityUtil.getCurrentUserId();
        return repository.findByUserIdAndNameContainingIgnoreCaseOrderByNameAsc(userId, query).stream()
                .map(FoodDto::from).toList();
    }

    private void resolveCategory(Food food, Long categoryId, Long userId) {
        if (categoryId != null) {
            FoodCategory category = categoryRepository.findByIdAndUserId(categoryId, userId)
                    .orElseThrow(() -> new ResourceNotFoundException("Food category not found: " + categoryId));
            food.setCategory(category);
        } else {
            food.setCategory(null);
        }
    }
}
