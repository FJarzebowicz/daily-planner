package com.dailyplanner.controller;

import com.dailyplanner.dto.FoodVariantDto;
import com.dailyplanner.service.FoodVariantService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/foods/{foodId}/variants")
public class FoodVariantController {

    private final FoodVariantService service;

    public FoodVariantController(FoodVariantService service) {
        this.service = service;
    }

    @GetMapping
    public List<FoodVariantDto> getAllByFood(@PathVariable Long foodId) {
        return service.getAllByFood(foodId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FoodVariantDto create(@PathVariable Long foodId, @Valid @RequestBody FoodVariantDto dto) {
        return service.create(foodId, dto);
    }

    @PutMapping("/{id}")
    public FoodVariantDto update(@PathVariable Long foodId, @PathVariable Long id, @Valid @RequestBody FoodVariantDto dto) {
        return service.update(foodId, id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long foodId, @PathVariable Long id) {
        service.delete(foodId, id);
    }
}
