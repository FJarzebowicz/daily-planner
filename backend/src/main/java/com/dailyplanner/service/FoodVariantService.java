package com.dailyplanner.service;

import com.dailyplanner.dto.FoodVariantDto;
import com.dailyplanner.entity.Food;
import com.dailyplanner.entity.FoodVariant;
import com.dailyplanner.exception.ResourceNotFoundException;
import com.dailyplanner.repository.FoodRepository;
import com.dailyplanner.repository.FoodVariantRepository;
import com.dailyplanner.security.SecurityUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FoodVariantService {

    private final FoodVariantRepository repository;
    private final FoodRepository foodRepository;

    public FoodVariantService(FoodVariantRepository repository, FoodRepository foodRepository) {
        this.repository = repository;
        this.foodRepository = foodRepository;
    }

    @Transactional(readOnly = true)
    public List<FoodVariantDto> getAllByFood(Long foodId) {
        verifyFoodOwnership(foodId);
        return repository.findByFoodIdOrderByNameAsc(foodId).stream()
                .map(FoodVariantDto::from).toList();
    }

    @Transactional
    public FoodVariantDto create(Long foodId, FoodVariantDto dto) {
        Food food = verifyFoodOwnership(foodId);
        FoodVariant variant = new FoodVariant();
        variant.setFood(food);
        variant.setName(dto.name());
        variant.setDescription(dto.description());
        variant.setPreparation(dto.preparation());
        return FoodVariantDto.from(repository.save(variant));
    }

    @Transactional
    public FoodVariantDto update(Long foodId, Long id, FoodVariantDto dto) {
        verifyFoodOwnership(foodId);
        FoodVariant variant = repository.findByIdAndFoodId(id, foodId)
                .orElseThrow(() -> new ResourceNotFoundException("Food variant not found: " + id));
        variant.setName(dto.name());
        variant.setDescription(dto.description());
        variant.setPreparation(dto.preparation());
        return FoodVariantDto.from(repository.save(variant));
    }

    @Transactional
    public void delete(Long foodId, Long id) {
        verifyFoodOwnership(foodId);
        repository.deleteByIdAndFoodId(id, foodId);
    }

    private Food verifyFoodOwnership(Long foodId) {
        Long userId = SecurityUtil.getCurrentUserId();
        return foodRepository.findByIdAndUserId(foodId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Food not found: " + foodId));
    }
}
