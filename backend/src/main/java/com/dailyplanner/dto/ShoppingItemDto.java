package com.dailyplanner.dto;

import com.dailyplanner.entity.ShoppingItem;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record ShoppingItemDto(
    Long id,
    @NotBlank String name,
    String categoryName,
    Long categoryId,
    @Min(1) int quantity,
    String unit,
    boolean bought,
    String createdAt
) {
    public static ShoppingItemDto from(ShoppingItem item) {
        return new ShoppingItemDto(
            item.getId(), item.getName(), item.getCategoryName(),
            item.getShoppingCategory() != null ? item.getShoppingCategory().getId() : null,
            item.getQuantity(), item.getUnit(), item.isBought(),
            item.getCreatedAt().toString()
        );
    }
}
