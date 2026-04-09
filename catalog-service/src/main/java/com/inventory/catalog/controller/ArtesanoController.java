package com.inventory.catalog.controller;

import com.inventory.catalog.dto.ArtesanoRequest;
import com.inventory.catalog.dto.ArtesanoResponse;
import com.inventory.catalog.service.ArtesanoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/api/artesanos")
public class ArtesanoController {

    private final ArtesanoService artesanoService;

    public ArtesanoController(ArtesanoService artesanoService) {
        this.artesanoService = artesanoService;
    }

    @GetMapping
    public Flux<ArtesanoResponse> getAllArtesanos() {
        return artesanoService.getAllArtesanos();
    }

    @GetMapping("/{id}")
    public Mono<ResponseEntity<ArtesanoResponse>> getArtesano(@PathVariable UUID id) {
        return artesanoService.getArtesano(id)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Mono<ResponseEntity<ArtesanoResponse>> createArtesano(
            @RequestBody ArtesanoRequest request,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        if (!"ADMIN".equals(userRole)) {
            return Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN).build());
        }
        return artesanoService.createArtesano(request)
                .map(response -> ResponseEntity.status(HttpStatus.CREATED).body(response));
    }

    @PutMapping("/{id}")
    public Mono<ResponseEntity<ArtesanoResponse>> updateArtesano(
            @PathVariable UUID id,
            @RequestBody ArtesanoRequest request,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        if (!"ADMIN".equals(userRole)) {
            return Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN).build());
        }
        return artesanoService.updateArtesano(id, request)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public Mono<ResponseEntity<Void>> deleteArtesano(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        if (!"ADMIN".equals(userRole)) {
            return Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN).build());
        }
        return artesanoService.deleteArtesano(id)
                .then(Mono.just(ResponseEntity.<Void>noContent().build()));
    }
}
