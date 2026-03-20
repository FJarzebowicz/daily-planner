package com.dailyplanner.dto;

import com.dailyplanner.entity.ShoppingCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ShoppingCategoryDto(
    Long id,
    @NotBlank @Size(max = 100) String name
) {
    public static ShoppingCategoryDto from(ShoppingCategory cat) {
        return new ShoppingCategoryDto(cat.getId(), cat.getName());
    }
}
