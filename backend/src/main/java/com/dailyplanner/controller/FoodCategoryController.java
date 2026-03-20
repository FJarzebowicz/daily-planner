package com.dailyplanner.controller;

import com.dailyplanner.dto.FoodCategoryDto;
import com.dailyplanner.service.FoodCategoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/food-categories")
public class FoodCategoryController {

    private final FoodCategoryService service;

    public FoodCategoryController(FoodCategoryService service) {
        this.service = service;
    }

    @GetMapping
    public List<FoodCategoryDto> getAll() {
        return service.getAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FoodCategoryDto create(@Valid @RequestBody FoodCategoryDto dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    public FoodCategoryDto update(@PathVariable Long id, @Valid @RequestBody FoodCategoryDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
