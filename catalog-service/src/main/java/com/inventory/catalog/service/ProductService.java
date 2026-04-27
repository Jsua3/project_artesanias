package com.inventory.catalog.service;

import com.inventory.catalog.dto.ProductRequest;
import com.inventory.catalog.dto.ProductResponse;
import com.inventory.catalog.model.Product;
import com.inventory.catalog.repository.ArtesanoRepository;
import com.inventory.catalog.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class ProductService {

    private final ProductRepository productRepository;
    private final ArtesanoRepository artesanoRepository;

    public ProductService(ProductRepository productRepository, ArtesanoRepository artesanoRepository) {
        this.productRepository = productRepository;
        this.artesanoRepository = artesanoRepository;
    }

    @Transactional
    public Mono<ProductResponse> createProduct(ProductRequest request) {
        return doCreateProduct(request, request.artesanoId());
    }

    /** Para rol ARTESANO: fuerza el artesanoId del usuario autenticado. */
    @Transactional
    public Mono<ProductResponse> createProductForArtesano(ProductRequest request, UUID userAccountId) {
        return artesanoRepository.findByUserAccountId(userAccountId)
                .switchIfEmpty(Mono.error(new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "No se encontró un artesano vinculado a tu cuenta")))
                .flatMap(artesano -> doCreateProduct(request, artesano.id()));
    }

    private Mono<ProductResponse> doCreateProduct(ProductRequest request, UUID artesanoId) {
        String sku = (request.sku() != null && !request.sku().isBlank())
                ? request.sku()
                : "SKU-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        UUID id = UUID.randomUUID();
        Product product = new Product(
                id,
                request.name(),
                request.description(),
                sku,
                request.price(),
                request.imageUrl(),
                request.stockMinimo(),
                request.categoryId(),
                artesanoId,
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

    /** Para rol ARTESANO: solo devuelve sus propios productos. */
    public Flux<ProductResponse> getAllProductsForArtesano(UUID userAccountId) {
        return artesanoRepository.findByUserAccountId(userAccountId)
                .flatMapMany(artesano -> productRepository.findByArtesanoId(artesano.id()))
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
                            existing.sku(),
                            request.price(),
                            request.imageUrl(),
                            request.stockMinimo(),
                            request.categoryId(),
                            existing.artesanoId(),
                            existing.active(),
                            existing.createdAt(),
                            LocalDateTime.now()
                    );
                    return productRepository.save(updated);
                })
                .map(this::toResponse);
    }

    /** Para rol ARTESANO: verifica que el producto pertenece al artesano del usuario. */
    @Transactional
    public Mono<ProductResponse> updateProductForArtesano(UUID id, ProductRequest request, UUID userAccountId) {
        return checkArtesanoOwnership(id, userAccountId)
                .flatMap(ok -> updateProduct(id, request));
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
    public Mono<Void> deleteProductForArtesano(UUID id, UUID userAccountId) {
        return checkArtesanoOwnership(id, userAccountId)
                .flatMap(ok -> deleteProduct(id));
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

    @Transactional
    public Mono<ProductResponse> updateProductStatusForArtesano(UUID id, boolean active, UUID userAccountId) {
        return checkArtesanoOwnership(id, userAccountId)
                .flatMap(ok -> updateProductStatus(id, active));
    }

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
