package com.inventory.catalog.controller;

import com.inventory.catalog.dto.*;
import com.inventory.catalog.repository.ArtesanoRepository;
import com.inventory.catalog.repository.CommunityEventRepository;
import com.inventory.catalog.repository.CommunityPostRepository;
import com.inventory.catalog.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/db")
public class AdminDbController {

    private final ArtesanoRepository artesanoRepository;
    private final ProductRepository productRepository;
    private final CommunityPostRepository postRepository;
    private final CommunityEventRepository eventRepository;

    public AdminDbController(ArtesanoRepository artesanoRepository,
                             ProductRepository productRepository,
                             CommunityPostRepository postRepository,
                             CommunityEventRepository eventRepository) {
        this.artesanoRepository = artesanoRepository;
        this.productRepository = productRepository;
        this.postRepository = postRepository;
        this.eventRepository = eventRepository;
    }

    @GetMapping("/artesanos")
    public Mono<PagedResponse<ArtesanoResponse>> listArtesanos(
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "") String search) {
        requireAdmin(userRole);
        int safeSize = Math.min(size, 100);
        return artesanoRepository.findAll()
                .filter(a -> search.isBlank()
                        || (a.nombre() != null && a.nombre().toLowerCase().contains(search.toLowerCase()))
                        || (a.email() != null && a.email().toLowerCase().contains(search.toLowerCase())))
                .collectList()
                .map(all -> paginate(all.stream()
                        .map(a -> new ArtesanoResponse(a.id(), a.nombre(), a.telefono(), a.email(),
                                a.especialidad(), a.ubicacion(), a.imageUrl(), a.active(), a.userAccountId(), a.createdAt()))
                        .collect(Collectors.toList()), page, safeSize));
    }

    @GetMapping("/products")
    public Mono<PagedResponse<ProductResponse>> listProducts(
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String artesanoId) {
        requireAdmin(userRole);
        int safeSize = Math.min(size, 100);
        return productRepository.findAll()
                .filter(p -> artesanoId == null || artesanoId.isBlank()
                        || (p.artesanoId() != null && p.artesanoId().toString().equals(artesanoId)))
                .collectList()
                .map(all -> paginate(all.stream()
                        .map(p -> new ProductResponse(p.id(), p.name(), p.description(), p.sku(),
                                p.price(), p.imageUrl(), p.stockMinimo(), p.categoryId(),
                                p.categoryId() != null ? java.util.List.of(p.categoryId()) : java.util.List.of(),
                                p.artesanoId(), p.active(), p.createdAt(), p.updatedAt()))
                        .collect(Collectors.toList()), page, safeSize));
    }

    @GetMapping("/posts")
    public Mono<PagedResponse<CommunityPostResponse>> listPosts(
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "") String estado) {
        requireAdmin(userRole);
        int safeSize = Math.min(size, 100);
        return postRepository.findAll()
                .filter(p -> estado.isBlank() || estado.equalsIgnoreCase(p.getEstado()))
                .collectList()
                .map(all -> paginate(all.stream()
                        .map(p -> new CommunityPostResponse(p.getId(), p.getAuthorId(), p.getAuthorName(),
                                p.getAuthorAvatarUrl(), p.getContent(), p.getImageUrl(),
                                p.getCreatedAt(), p.getLikesCount(), p.getCommentsCount(),
                                p.getEstado(), false))
                        .collect(Collectors.toList()), page, safeSize));
    }

    @GetMapping("/eventos")
    public Mono<PagedResponse<CommunityEventResponse>> listEventos(
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "") String estado) {
        requireAdmin(userRole);
        int safeSize = Math.min(size, 100);
        return eventRepository.findAll()
                .filter(e -> estado.isBlank() || estado.equalsIgnoreCase(e.getEstado()))
                .collectList()
                .map(all -> paginate(all.stream()
                        .map(e -> new CommunityEventResponse(e.id(), e.artesanoId(), e.artesanoNombre(),
                                e.organizacion(), e.nombre(), e.localidad(), e.direccionExacta(),
                                e.fechaInicio(), e.fechaFin(), e.hora(), e.descripcion(), e.estado(),
                                e.reviewComment(), e.createdAt()))
                        .collect(Collectors.toList()), page, safeSize));
    }

    private void requireAdmin(String userRole) {
        if (!"ADMIN".equals(userRole)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        }
    }

    private <T> PagedResponse<T> paginate(List<T> all, int page, int size) {
        long total = all.size();
        int totalPages = (int) Math.ceil((double) total / size);
        List<T> content = all.stream().skip((long) page * size).limit(size).collect(Collectors.toList());
        return new PagedResponse<>(content, page, size, total, totalPages);
    }
}
