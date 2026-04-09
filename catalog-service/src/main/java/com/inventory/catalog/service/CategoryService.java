package com.inventory.catalog.service;

import com.inventory.catalog.dto.CategoryRequest;
import com.inventory.catalog.dto.CategoryResponse;
import com.inventory.catalog.model.Category;
import com.inventory.catalog.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Transactional
    public Mono<CategoryResponse> createCategory(CategoryRequest request) {
        UUID id = UUID.randomUUID();
        Category category = new Category(id, request.name(), request.description(), true);
        return categoryRepository.save(category.withIsNew(true))
                .map(this::toResponse);
    }

    public Mono<CategoryResponse> getCategory(UUID id) {
        return categoryRepository.findById(id)
                .filter(c -> Boolean.TRUE.equals(c.active()))
                .map(this::toResponse);
    }

    public Flux<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll()
                .filter(c -> Boolean.TRUE.equals(c.active()))
                .map(this::toResponse);
    }

    @Transactional
    public Mono<CategoryResponse> updateCategory(UUID id, CategoryRequest request) {
        return categoryRepository.findById(id)
                .flatMap(existing -> {
                    Category updated = new Category(id, request.name(), request.description(), existing.active());
                    return categoryRepository.save(updated);
                })
                .map(this::toResponse);
    }

    @Transactional
    public Mono<Void> deleteCategory(UUID id) {
        return categoryRepository.findById(id)
                .flatMap(existing -> {
                    Category softDeleted = new Category(id, existing.name(), existing.description(), false);
                    return categoryRepository.save(softDeleted);
                })
                .then();
    }

    private CategoryResponse toResponse(Category category) {
        return new CategoryResponse(category.id(), category.name(), category.description(), category.active());
    }
}
