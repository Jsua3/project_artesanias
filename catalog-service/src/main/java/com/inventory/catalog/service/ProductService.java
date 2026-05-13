package com.inventory.catalog.service;

import com.inventory.catalog.dto.ProductRequest;
import com.inventory.catalog.dto.ProductResponse;
import com.inventory.catalog.dto.PublicProductResponse;
import com.inventory.catalog.model.Product;
import com.inventory.catalog.model.ProductCategory;
import com.inventory.catalog.repository.ArtesanoRepository;
import com.inventory.catalog.repository.ProductCategoryRepository;
import com.inventory.catalog.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductCategoryRepository productCategoryRepository;
    private final ArtesanoRepository artesanoRepository;

    public ProductService(ProductRepository productRepository,
                          ProductCategoryRepository productCategoryRepository,
                          ArtesanoRepository artesanoRepository) {
        this.productRepository = productRepository;
        this.productCategoryRepository = productCategoryRepository;
        this.artesanoRepository = artesanoRepository;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    /** Normaliza categoryIds desde el request (soporta campo legacy + nuevo). */
    private List<UUID> resolveCategoryIds(ProductRequest request) {
        if (request.categoryIds() != null && !request.categoryIds().isEmpty()) {
            return request.categoryIds();
        }
        if (request.categoryId() != null) {
            return List.of(request.categoryId());
        }
        return List.of();
    }

    /** Guarda las relaciones producto-categoría (asume que ya fueron borradas). */
    private Mono<Void> saveCategories(UUID productId, List<UUID> categoryIds) {
        if (categoryIds == null || categoryIds.isEmpty()) return Mono.empty();
        return Flux.fromIterable(categoryIds)
                .map(catId -> new ProductCategory(UUID.randomUUID(), productId, catId).withIsNew(true))
                .flatMap(productCategoryRepository::save)
                .then();
    }

    /** Reemplaza las categorías de un producto. */
    private Mono<Void> replaceCategories(UUID productId, List<UUID> categoryIds) {
        return productCategoryRepository.deleteByProductId(productId)
                .then(saveCategories(productId, categoryIds));
    }

    /** Enriquece un producto con su lista de categorías desde la tabla junction. */
    private Mono<ProductResponse> enrichWithCategories(Product product) {
        return productCategoryRepository.findByProductId(product.id())
                .map(ProductCategory::getCategoryId)
                .collectList()
                .map(ids -> {
                    if (ids.isEmpty() && product.categoryId() != null) {
                        ids = new ArrayList<>(List.of(product.categoryId()));
                    }
                    return toResponse(product, ids);
                });
    }

    private ProductResponse toResponse(Product product, List<UUID> categoryIds) {
        UUID primary = categoryIds.isEmpty() ? product.categoryId()
                     : (categoryIds.get(0) != null ? categoryIds.get(0) : product.categoryId());
        return new ProductResponse(
                product.id(),
                product.name(),
                product.description(),
                product.sku(),
                product.price(),
                product.imageUrl(),
                product.stockMinimo(),
                primary,
                categoryIds,
                product.artesanoId(),
                product.active(),
                product.createdAt(),
                product.updatedAt()
        );
    }

    private PublicProductResponse toPublicResponse(ProductResponse product) {
        return new PublicProductResponse(
                product.id(),
                product.name(),
                product.description(),
                product.price(),
                product.imageUrl(),
                product.categoryId(),
                product.categoryIds(),
                product.artesanoId()
        );
    }

    // ── Create ────────────────────────────────────────────────────────────────

    @Transactional
    public Mono<ProductResponse> createProduct(ProductRequest request) {
        return doCreateProduct(request, request.artesanoId());
    }

    @Transactional
    public Mono<ProductResponse> createProductForArtesano(ProductRequest request, UUID userAccountId) {
        return artesanoRepository.findByUserAccountId(userAccountId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "No se encontró un artesano vinculado a tu cuenta")))
                .flatMap(artesano -> doCreateProduct(request, artesano.id()));
    }

    private Mono<ProductResponse> doCreateProduct(ProductRequest request, UUID artesanoId) {
        List<UUID> categoryIds = resolveCategoryIds(request);
        UUID primaryCategoryId = categoryIds.isEmpty() ? null : categoryIds.get(0);

        String sku = (request.sku() != null && !request.sku().isBlank())
                ? request.sku()
                : "SKU-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        UUID id = UUID.randomUUID();
        Product product = new Product(
                id, request.name(), request.description(), sku,
                request.price(), request.imageUrl(), request.stockMinimo(),
                primaryCategoryId, artesanoId, true,
                LocalDateTime.now(), LocalDateTime.now()
        );
        return productRepository.save(product.withIsNew(true))
                .flatMap(saved -> saveCategories(saved.id(), categoryIds)
                        .then(enrichWithCategories(saved)));
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    public Mono<ProductResponse> getProduct(UUID id) {
        return productRepository.findById(id)
                .filter(p -> Boolean.TRUE.equals(p.active()))
                .flatMap(this::enrichWithCategories);
    }

    public Mono<PublicProductResponse> getPublicProduct(UUID id) {
        return getProduct(id).map(this::toPublicResponse);
    }

    public Flux<ProductResponse> getAllProducts() {
        return productRepository.findByActiveTrue()
                .flatMap(this::enrichWithCategories);
    }

    public Flux<PublicProductResponse> getAllPublicProducts() {
        return getAllProducts().map(this::toPublicResponse);
    }

    public Flux<ProductResponse> getAllProductsForManagement() {
        return productRepository.findAll()
                .flatMap(this::enrichWithCategories);
    }

    public Flux<ProductResponse> getAllProductsForArtesano(UUID userAccountId) {
        return artesanoRepository.findByUserAccountId(userAccountId)
                .flatMapMany(artesano -> productRepository.findByArtesanoId(artesano.id()))
                .flatMap(this::enrichWithCategories);
    }

    public Flux<ProductResponse> getProductsByCategory(UUID categoryId) {
        // Busca en junction table (incluye productos con múltiples categorías)
        return productCategoryRepository.findByCategoryId(categoryId)
                .map(ProductCategory::getProductId)
                .flatMap(productRepository::findById)
                .filter(p -> Boolean.TRUE.equals(p.active()))
                .flatMap(this::enrichWithCategories);
    }

    public Flux<PublicProductResponse> getPublicProductsByCategory(UUID categoryId) {
        return getProductsByCategory(categoryId).map(this::toPublicResponse);
    }

    public Flux<ProductResponse> getProductsByArtesano(UUID artesanoId) {
        return productRepository.findByArtesanoId(artesanoId)
                .filter(p -> Boolean.TRUE.equals(p.active()))
                .flatMap(this::enrichWithCategories);
    }

    public Flux<PublicProductResponse> getPublicProductsByArtesano(UUID artesanoId) {
        return getProductsByArtesano(artesanoId).map(this::toPublicResponse);
    }

    public Flux<ProductResponse> getProductsByArtesanoForManagement(UUID artesanoId) {
        return productRepository.findByArtesanoId(artesanoId)
                .flatMap(this::enrichWithCategories);
    }

    // ── Update ────────────────────────────────────────────────────────────────

    @Transactional
    public Mono<ProductResponse> updateProduct(UUID id, ProductRequest request) {
        List<UUID> categoryIds = resolveCategoryIds(request);
        UUID primaryCategoryId = categoryIds.isEmpty() ? null : categoryIds.get(0);

        return productRepository.findById(id)
                .flatMap(existing -> {
                    Product updated = new Product(
                            id, request.name(), request.description(), existing.sku(),
                            request.price(), request.imageUrl(), request.stockMinimo(),
                            primaryCategoryId, existing.artesanoId(),
                            existing.active(), existing.createdAt(), LocalDateTime.now()
                    );
                    return productRepository.save(updated)
                            .flatMap(saved -> replaceCategories(saved.id(), categoryIds)
                                    .then(enrichWithCategories(saved)));
                });
    }

    @Transactional
    public Mono<ProductResponse> updateProductForArtesano(UUID id, ProductRequest request, UUID userAccountId) {
        return checkArtesanoOwnership(id, userAccountId)
                .flatMap(ok -> updateProduct(id, request));
    }

    // ── Delete ────────────────────────────────────────────────────────────────

    @Transactional
    public Mono<Void> deleteProduct(UUID id) {
        return productRepository.findById(id)
                .flatMap(existing -> {
                    Product softDeleted = new Product(
                            id, existing.name(), existing.description(), existing.sku(),
                            existing.price(), existing.imageUrl(), existing.stockMinimo(),
                            existing.categoryId(), existing.artesanoId(),
                            false, existing.createdAt(), LocalDateTime.now()
                    );
                    return productRepository.save(softDeleted);
                })
                .then();
    }

    @Transactional
    public Mono<Void> deleteProductForArtesano(UUID id, UUID userAccountId) {
        return checkArtesanoOwnership(id, userAccountId)
                .flatMap(ok -> deleteProduct(id));
    }

    // ── Status toggle ─────────────────────────────────────────────────────────

    @Transactional
    public Mono<ProductResponse> updateProductStatus(UUID id, boolean active) {
        return productRepository.findById(id)
                .flatMap(existing -> {
                    Product updated = new Product(
                            id, existing.name(), existing.description(), existing.sku(),
                            existing.price(), existing.imageUrl(), existing.stockMinimo(),
                            existing.categoryId(), existing.artesanoId(),
                            active, existing.createdAt(), LocalDateTime.now()
                    );
                    return productRepository.save(updated)
                            .flatMap(this::enrichWithCategories);
                });
    }

    @Transactional
    public Mono<ProductResponse> updateProductStatusForArtesano(UUID id, boolean active, UUID userAccountId) {
        return checkArtesanoOwnership(id, userAccountId)
                .flatMap(ok -> updateProductStatus(id, active));
    }

    // ── Ownership check ───────────────────────────────────────────────────────

    private Mono<Boolean> checkArtesanoOwnership(UUID productId, UUID userAccountId) {
        return artesanoRepository.findByUserAccountId(userAccountId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "No se encontró un artesano vinculado a tu cuenta")))
                .flatMap(artesano -> productRepository.findById(productId)
                        .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.NOT_FOUND,
                                "Producto no encontrado")))
                        .flatMap(product -> {
                            if (!artesano.id().equals(product.artesanoId())) {
                                return Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN,
                                        "No tienes permiso para modificar este producto"));
                            }
                            return Mono.just(true);
                        }));
    }
}
