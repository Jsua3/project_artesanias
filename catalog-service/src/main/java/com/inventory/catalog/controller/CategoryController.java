package com.inventory.catalog.controller;

import com.inventory.catalog.dto.CategoryRequest;
import com.inventory.catalog.dto.CategoryResponse;
import com.inventory.catalog.service.CategoryService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
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
    public Flux<CategoryResponse> findAll() {
        return categoryService.findAll();
    }

    @GetMapping("/{id}")
    public Mono<CategoryResponse> findById(@PathVariable UUID id) {
        return categoryService.findById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<CategoryResponse> create(@RequestBody CategoryRequest request,
                                         @RequestHeader("X-User-Role") String role) {
        validateAdmin(role);
        return categoryService.create(request);
    }

    @PutMapping("/{id}")
    public Mono<CategoryResponse> update(@PathVariable UUID id,
                                         @RequestBody CategoryRequest request,
                                         @RequestHeader("X-User-Role") String role) {
        validateAdmin(role);
        return categoryService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public Mono<Void> delete(@PathVariable UUID id,
                               @RequestHeader("X-User-Role") String role) {
        validateAdmin(role);
        return categoryService.delete(id);
    }

    private void validateAdmin(String role) {
        if (!"ADMIN".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only ADMIN can perform this action");
        }
    }
}
