package com.inventory.catalog.repository;

import com.inventory.catalog.model.Product;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface ProductRepository extends ReactiveCrudRepository<Product, UUID> {
    Mono<Product> findBySku(String sku);
}
