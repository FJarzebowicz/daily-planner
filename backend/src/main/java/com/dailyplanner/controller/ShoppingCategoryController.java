package com.dailyplanner.controller;

import com.dailyplanner.dto.ShoppingCategoryDto;
import com.dailyplanner.service.ShoppingCategoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shopping-categories")
public class ShoppingCategoryController {

    private final ShoppingCategoryService service;

    public ShoppingCategoryController(ShoppingCategoryService service) {
        this.service = service;
    }

    @GetMapping
    public List<ShoppingCategoryDto> getAll() {
        return service.getAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ShoppingCategoryDto create(@Valid @RequestBody ShoppingCategoryDto dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    public ShoppingCategoryDto update(@PathVariable Long id, @Valid @RequestBody ShoppingCategoryDto dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
