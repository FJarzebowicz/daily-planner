package com.dailyplanner.dto;

import com.dailyplanner.entity.FoodCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record FoodCategoryDto(
    Long id,
    @NotBlank @Size(max = 100) String name
) {
    public static FoodCategoryDto from(FoodCategory cat) {
        return new FoodCategoryDto(cat.getId(), cat.getName());
    }
}
