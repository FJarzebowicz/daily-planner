package com.dailyplanner.dto;

import com.dailyplanner.entity.Food;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record FoodDto(
    Long id,
    @NotBlank String name,
    String description,
    String imageUrl,
    String link,
    Long categoryId,
    String categoryName,
    String createdAt,
    List<FoodVariantDto> variants
) {
    public static FoodDto from(Food food) {
        return new FoodDto(
            food.getId(), food.getName(), food.getDescription(),
            food.getImageUrl(), food.getLink(),
            food.getCategory() != null ? food.getCategory().getId() : null,
            food.getCategory() != null ? food.getCategory().getName() : null,
            food.getCreatedAt().toString(),
            null
        );
    }

    public static FoodDto fromWithVariants(Food food, List<FoodVariantDto> variants) {
        return new FoodDto(
            food.getId(), food.getName(), food.getDescription(),
            food.getImageUrl(), food.getLink(),
            food.getCategory() != null ? food.getCategory().getId() : null,
            food.getCategory() != null ? food.getCategory().getName() : null,
            food.getCreatedAt().toString(),
            variants
        );
    }
}
