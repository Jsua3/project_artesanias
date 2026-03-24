package com.inventory.catalog.service;

import com.inventory.catalog.dto.CategoryRequest;
import com.inventory.catalog.dto.CategoryResponse;
import com.inventory.catalog.model.Category;
import com.inventory.catalog.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public Flux<CategoryResponse> findAll() {
        return categoryRepository.findAll()
                .map(category -> new CategoryResponse(category.getId(), category.getName()));
    }

    public Mono<CategoryResponse> findById(UUID id) {
        return categoryRepository.findById(id)
                .map(category -> new CategoryResponse(category.getId(), category.getName()));
    }

    public Mono<CategoryResponse> create(CategoryRequest request) {
        Category category = new Category();
        category.setId(UUID.randomUUID());
        category.setName(request.name());
        return categoryRepository.save(category)
                .map(saved -> new CategoryResponse(saved.getId(), saved.getName()));
    }

    public Mono<CategoryResponse> update(UUID id, CategoryRequest request) {
        return categoryRepository.findById(id)
                .flatMap(existing -> {
                    existing.setName(request.name());
                    return categoryRepository.save(existing);
                })
                .map(saved -> new CategoryResponse(saved.getId(), saved.getName()));
    }

    public Mono<Void> delete(UUID id) {
        return categoryRepository.deleteById(id);
    }
}
