package com.inventory.catalog.repository;

import com.inventory.catalog.model.Product;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

import java.util.UUID;

public interface ProductRepository extends ReactiveCrudRepository<Product, UUID> {
    Flux<Product> findByCategoryId(UUID categoryId);
    Flux<Product> findByArtesanoId(UUID artesanoId);
    Flux<Product> findByActiveTrue();
}
