package com.dailyplanner.dto;

import com.dailyplanner.entity.FoodVariant;
import jakarta.validation.constraints.NotBlank;

public record FoodVariantDto(
    Long id,
    @NotBlank String name,
    String description,
    String preparation
) {
    public static FoodVariantDto from(FoodVariant v) {
        return new FoodVariantDto(v.getId(), v.getName(), v.getDescription(), v.getPreparation());
    }
}
