package com.dailyplanner.dto;

import com.dailyplanner.entity.Category;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CategoryDto(
    Long id,
    @NotBlank @Size(max = 100) String name,
    @NotBlank @Size(max = 7) String color,
    int sortOrder
) {
    public static CategoryDto from(Category cat) {
        return new CategoryDto(cat.getId(), cat.getName(), cat.getColor(), cat.getSortOrder());
    }
}
