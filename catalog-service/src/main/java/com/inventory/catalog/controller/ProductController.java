package com.inventory.catalog.controller;

import com.inventory.catalog.dto.ProductRequest;
import com.inventory.catalog.dto.ProductResponse;
import com.inventory.catalog.dto.ProductStatusUpdateRequest;
import com.inventory.catalog.dto.PublicProductResponse;
import com.inventory.catalog.service.ProductService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
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
    public Flux<PublicProductResponse> getAllProducts() {
        return productService.getAllPublicProducts();
    }

    @GetMapping("/admin/all")
    public Flux<ProductResponse> getAllProductsForManagement(
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (!canManageProducts(userRole)) {
            return Flux.error(new ResponseStatusException(HttpStatus.FORBIDDEN));
        }
        if ("ARTESANO".equals(userRole) && userId != null) {
            return productService.getAllProductsForArtesano(UUID.fromString(userId));
        }
        return productService.getAllProductsForManagement();
    }

    @GetMapping("/{id}")
    public Mono<ResponseEntity<PublicProductResponse>> getProduct(@PathVariable UUID id) {
        return productService.getPublicProduct(id)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @GetMapping("/category/{categoryId}")
    public Flux<PublicProductResponse> getProductsByCategory(@PathVariable UUID categoryId) {
        return productService.getPublicProductsByCategory(categoryId);
    }

    @GetMapping("/artesano/{artesanoId}")
    public Flux<PublicProductResponse> getProductsByArtesano(@PathVariable UUID artesanoId) {
        return productService.getPublicProductsByArtesano(artesanoId);
    }

    @GetMapping("/admin/artesano/{artesanoId}")
    public Flux<ProductResponse> getProductsByArtesanoForManagement(
            @PathVariable UUID artesanoId,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        if (!canManageProducts(userRole)) {
            return Flux.error(new ResponseStatusException(HttpStatus.FORBIDDEN));
        }
        return productService.getProductsByArtesanoForManagement(artesanoId);
    }

    @PostMapping
    public Mono<ResponseEntity<ProductResponse>> createProduct(
            @RequestBody ProductRequest request,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (!canManageProducts(userRole)) {
            return Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN).build());
        }
        Mono<ProductResponse> op = "ARTESANO".equals(userRole) && userId != null
                ? productService.createProductForArtesano(request, UUID.fromString(userId))
                : productService.createProduct(request);
        return op.map(response -> ResponseEntity.status(HttpStatus.CREATED).body(response));
    }

    @PutMapping("/{id}")
    public Mono<ResponseEntity<ProductResponse>> updateProduct(
            @PathVariable UUID id,
            @RequestBody ProductRequest request,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (!canManageProducts(userRole)) {
            return Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN).build());
        }
        Mono<ProductResponse> op = "ARTESANO".equals(userRole) && userId != null
                ? productService.updateProductForArtesano(id, request, UUID.fromString(userId))
                : productService.updateProduct(id, request);
        return op.map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Void>> deleteProduct(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (!canManageProducts(userRole)) {
            return Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN).build());
        }
        Mono<Void> op = "ARTESANO".equals(userRole) && userId != null
                ? productService.deleteProductForArtesano(id, UUID.fromString(userId))
                : productService.deleteProduct(id);
        return op.then(Mono.just(ResponseEntity.<Void>noContent().build()));
    }

    @PatchMapping("/{id}/active")
    public Mono<ResponseEntity<ProductResponse>> updateProductStatus(
            @PathVariable UUID id,
            @RequestBody ProductStatusUpdateRequest request,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        if (!canManageProducts(userRole)) {
            return Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN).build());
        }
        if (request.active() == null) {
            return Mono.just(ResponseEntity.badRequest().build());
        }
        Mono<ProductResponse> op = "ARTESANO".equals(userRole) && userId != null
                ? productService.updateProductStatusForArtesano(id, request.active(), UUID.fromString(userId))
                : productService.updateProductStatus(id, request.active());
        return op.map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    private boolean canManageProducts(String userRole) {
        return "ADMIN".equals(userRole) || "MAESTRO".equals(userRole) || "ARTESANO".equals(userRole);
    }
}
