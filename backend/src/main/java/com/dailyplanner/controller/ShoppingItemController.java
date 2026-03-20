package com.dailyplanner.controller;

import com.dailyplanner.dto.ShoppingItemDto;
import com.dailyplanner.service.ShoppingItemService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shopping")
public class ShoppingItemController {

    private final ShoppingItemService service;

    public ShoppingItemController(ShoppingItemService service) {
        this.service = service;
    }

    @GetMapping
    public List<ShoppingItemDto> getAll() {
        return service.getAll();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ShoppingItemDto create(@Valid @RequestBody ShoppingItemDto dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    public ShoppingItemDto update(@PathVariable Long id, @Valid @RequestBody ShoppingItemDto dto) {
        return service.update(id, dto);
    }

    @PatchMapping("/{id}/toggle")
    public ShoppingItemDto toggleBought(@PathVariable Long id) {
        return service.toggleBought(id);
    }

    @DeleteMapping("/bought")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteBought() {
        service.deleteBought();
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
