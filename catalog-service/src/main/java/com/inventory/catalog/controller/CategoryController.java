package com.inventory.catalog.controller;

import com.inventory.catalog.dto.CategoryRequest;
import com.inventory.catalog.dto.CategoryResponse;
import com.inventory.catalog.service.CategoryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public Flux<CategoryResponse> getAllCategories() {
        return categoryService.getAllCategories();
    }

    @GetMapping("/{id}")
    public Mono<ResponseEntity<CategoryResponse>> getCategory(@PathVariable UUID id) {
        return categoryService.getCategory(id)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Mono<ResponseEntity<CategoryResponse>> createCategory(
            @RequestBody CategoryRequest request,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        if (!"ADMIN".equals(userRole)) {
            return Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN).build());
        }
        return categoryService.createCategory(request)
                .map(response -> ResponseEntity.status(HttpStatus.CREATED).body(response));
    }

    @PutMapping("/{id}")
    public Mono<ResponseEntity<CategoryResponse>> updateCategory(
            @PathVariable UUID id,
            @RequestBody CategoryRequest request,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        if (!"ADMIN".equals(userRole)) {
            return Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN).build());
        }
        return categoryService.updateCategory(id, request)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Void>> deleteCategory(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        if (!"ADMIN".equals(userRole)) {
            return Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN).build());
        }
        return categoryService.deleteCategory(id)
                .then(Mono.just(ResponseEntity.<Void>noContent().build()));
    }
}
