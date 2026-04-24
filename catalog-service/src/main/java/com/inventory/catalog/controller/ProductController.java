package com.inventory.catalog.controller;

import com.inventory.catalog.dto.ProductRequest;
import com.inventory.catalog.dto.ProductResponse;
import com.inventory.catalog.service.ProductService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public Flux<ProductResponse> getAllProducts() {
        return productService.getAllProducts();
    }

    @GetMapping("/{id}")
    public Mono<ResponseEntity<ProductResponse>> getProduct(@PathVariable UUID id) {
        return productService.getProduct(id)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @GetMapping("/category/{categoryId}")
    public Flux<ProductResponse> getProductsByCategory(@PathVariable UUID categoryId) {
        return productService.getProductsByCategory(categoryId);
    }

    @GetMapping("/artesano/{artesanoId}")
    public Flux<ProductResponse> getProductsByArtesano(@PathVariable UUID artesanoId) {
        return productService.getProductsByArtesano(artesanoId);
    }

    @PostMapping
    public Mono<ResponseEntity<ProductResponse>> createProduct(
            @RequestBody ProductRequest request,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        if (!canManageProducts(userRole)) {
            return Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN).build());
        }
        return productService.createProduct(request)
                .map(response -> ResponseEntity.status(HttpStatus.CREATED).body(response));
    }

    @PutMapping("/{id}")
    public Mono<ResponseEntity<ProductResponse>> updateProduct(
            @PathVariable UUID id,
            @RequestBody ProductRequest request,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        if (!canManageProducts(userRole)) {
            return Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN).build());
        }
        return productService.updateProduct(id, request)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Void>> deleteProduct(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        if (!canManageProducts(userRole)) {
            return Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN).build());
        }
        return productService.deleteProduct(id)
                .then(Mono.just(ResponseEntity.<Void>noContent().build()));
    }

    private boolean canManageProducts(String userRole) {
        return "ADMIN".equals(userRole) || "MAESTRO".equals(userRole);
    }
}
