package com.inventory.catalog.service;

import com.inventory.catalog.dto.ProductRequest;
import com.inventory.catalog.dto.ProductResponse;
import com.inventory.catalog.model.Product;
import com.inventory.catalog.repository.ProductRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    @Transactional
    public Mono<ProductResponse> createProduct(ProductRequest request) {
        UUID id = UUID.randomUUID();
        Product product = new Product(
                id,
                request.name(),
                request.description(),
                request.sku(),
                request.price(),
                request.imageUrl(),
                request.stockMinimo(),
                request.categoryId(),
                request.artesanoId(),
                true,
                LocalDateTime.now(),
                LocalDateTime.now()
        );
        return productRepository.save(product.withIsNew(true))
                .map(this::toResponse);
    }

    public Mono<ProductResponse> getProduct(UUID id) {
        return productRepository.findById(id)
                .filter(p -> Boolean.TRUE.equals(p.active()))
                .map(this::toResponse);
    }

    public Flux<ProductResponse> getAllProducts() {
        return productRepository.findByActiveTrue()
                .map(this::toResponse);
    }

    public Flux<ProductResponse> getAllProductsForManagement() {
        return productRepository.findAll()
                .map(this::toResponse);
    }

    public Flux<ProductResponse> getProductsByCategory(UUID categoryId) {
        return productRepository.findByCategoryId(categoryId)
                .filter(p -> Boolean.TRUE.equals(p.active()))
                .map(this::toResponse);
    }

    public Flux<ProductResponse> getProductsByArtesano(UUID artesanoId) {
        return productRepository.findByArtesanoId(artesanoId)
                .filter(p -> Boolean.TRUE.equals(p.active()))
                .map(this::toResponse);
    }

    public Flux<ProductResponse> getProductsByArtesanoForManagement(UUID artesanoId) {
        return productRepository.findByArtesanoId(artesanoId)
                .map(this::toResponse);
    }

    @Transactional
    public Mono<ProductResponse> updateProduct(UUID id, ProductRequest request) {
        return productRepository.findById(id)
                .flatMap(existing -> {
                    Product updated = new Product(
                            id,
                            request.name(),
                            request.description(),
                            request.sku(),
                            request.price(),
                            request.imageUrl(),
                            request.stockMinimo(),
                            request.categoryId(),
                            request.artesanoId(),
                            existing.active(),
                            existing.createdAt(),
                            LocalDateTime.now()
                    );
                    return productRepository.save(updated);
                })
                .map(this::toResponse);
    }

    @Transactional
    public Mono<Void> deleteProduct(UUID id) {
        return productRepository.findById(id)
                .flatMap(existing -> {
                    Product softDeleted = new Product(
                            id,
                            existing.name(),
                            existing.description(),
                            existing.sku(),
                            existing.price(),
                            existing.imageUrl(),
                            existing.stockMinimo(),
                            existing.categoryId(),
                            existing.artesanoId(),
                            false,
                            existing.createdAt(),
                            LocalDateTime.now()
                    );
                    return productRepository.save(softDeleted);
                })
                .then();
    }

    @Transactional
    public Mono<ProductResponse> updateProductStatus(UUID id, boolean active) {
        return productRepository.findById(id)
                .flatMap(existing -> {
                    Product updated = new Product(
                            id,
                            existing.name(),
                            existing.description(),
                            existing.sku(),
                            existing.price(),
                            existing.imageUrl(),
                            existing.stockMinimo(),
                            existing.categoryId(),
                            existing.artesanoId(),
                            active,
                            existing.createdAt(),
                            LocalDateTime.now()
                    );
                    return productRepository.save(updated);
                })
                .map(this::toResponse);
    }

    private ProductResponse toResponse(Product product) {
        return new ProductResponse(
                product.id(),
                product.name(),
                product.description(),
                product.sku(),
                product.price(),
                product.imageUrl(),
                product.stockMinimo(),
                product.categoryId(),
                product.artesanoId(),
                product.active(),
                product.createdAt(),
                product.updatedAt()
        );
    }
}
