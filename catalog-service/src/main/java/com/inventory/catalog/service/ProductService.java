package com.inventory.catalog.service;

import com.inventory.catalog.dto.ProductRequest;
import com.inventory.catalog.dto.ProductResponse;
import com.inventory.catalog.model.Product;
import com.inventory.catalog.repository.ProductRepository;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public Flux<ProductResponse> findAll() {
        return productRepository.findAll()
                .map(p -> {
                    p.setNew(false);
                    return p;
                })
                .map(this::toResponse);
    }

    public Mono<ProductResponse> findById(UUID id) {
        return productRepository.findById(id)
                .map(p -> {
                    p.setNew(false);
                    return p;
                })
                .map(this::toResponse);
    }

    public Mono<ProductResponse> create(ProductRequest request) {
        return productRepository.findBySku(request.sku())
                .flatMap(existing -> Mono.<Product>error(new RuntimeException("SKU already exists")))
                .switchIfEmpty(Mono.defer(() -> {
                    Product product = new Product();
                    product.setId(UUID.randomUUID());
                    product.setName(request.name());
                    product.setSku(request.sku());
                    product.setPrice(request.price());
                    product.setCategoryId(request.categoryId());
                    return productRepository.save(product)
                            .map(p -> {
                                p.setNew(false);
                                return p;
                            });
                }))
                .map(this::toResponse);
    }

    public Mono<ProductResponse> update(UUID id, ProductRequest request) {
        return productRepository.findById(id)
                .flatMap(existing -> {
                    existing.setNew(false);
                    existing.setName(request.name());
                    existing.setSku(request.sku());
                    existing.setPrice(request.price());
                    existing.setCategoryId(request.categoryId());
                    return productRepository.save(existing)
                            .map(p -> {
                                p.setNew(false);
                                return p;
                            });
                })
                .map(this::toResponse);
    }

    public Mono<Void> delete(UUID id) {
        return productRepository.deleteById(id);
    }

    private ProductResponse toResponse(Product product) {
        return new ProductResponse(
                product.getId(),
                product.getName(),
                product.getSku(),
                product.getPrice(),
                product.getCategoryId()
        );
    }
}
