package com.inventory.catalog.repository;

import com.inventory.catalog.model.ProductCategory;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface ProductCategoryRepository extends ReactiveCrudRepository<ProductCategory, UUID> {
    Flux<ProductCategory> findByProductId(UUID productId);
    Flux<ProductCategory> findByCategoryId(UUID categoryId);
    Mono<Void> deleteByProductId(UUID productId);
}
