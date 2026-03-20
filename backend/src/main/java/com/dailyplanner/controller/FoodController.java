package com.dailyplanner.controller;

import com.dailyplanner.dto.FoodDto;
import com.dailyplanner.service.FoodService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;

@RestController
@RequestMapping("/api/foods")
public class FoodController {

    private final FoodService service;

    public FoodController(FoodService service) {
        this.service = service;
    }

    @GetMapping
    public List<FoodDto> getAll(@RequestParam(required = false) Long categoryId) {
        return service.getAll(categoryId);
    }

    @GetMapping("/{id}")
    public FoodDto getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @GetMapping("/search")
    public List<FoodDto> search(@RequestParam String q) {
        return service.search(q);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public FoodDto create(@Valid @RequestBody FoodDto dto) {
        return service.create(dto);
    }

    @PutMapping("/{id}")
    public FoodDto update(@PathVariable Long id, @Valid @RequestBody FoodDto dto) {
        return service.update(id, dto);
    }

    @PostMapping("/{id}/image")
    public FoodDto uploadImage(@PathVariable Long id, @RequestParam("file") MultipartFile file) throws IOException {
        String uploadDir = "uploads/food-images";
        Path dir = Paths.get(uploadDir);
        Files.createDirectories(dir);
        String filename = id + "_" + System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path filePath = dir.resolve(filename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        String imageUrl = "/uploads/food-images/" + filename;
        return service.updateImageUrl(id, imageUrl);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
