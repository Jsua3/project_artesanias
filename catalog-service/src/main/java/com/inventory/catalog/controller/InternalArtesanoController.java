package com.inventory.catalog.controller;

import com.inventory.catalog.dto.ArtesanoResponse;
import com.inventory.catalog.dto.SyncArtesanoRequest;
import com.inventory.catalog.service.ArtesanoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Endpoints internos (service-to-service). El api-gateway NO rutea /internal/**
 * externamente. El InternalGatewayFilter exige X-Internal-Token en todas las llamadas.
 */
@RestController
@RequestMapping("/internal/artesanos")
public class InternalArtesanoController {

    private final ArtesanoService artesanoService;

    public InternalArtesanoController(ArtesanoService artesanoService) {
        this.artesanoService = artesanoService;
    }

    /** Devuelve el artesano vinculado a un user_account_id, o 404 si no hay link. */
    @GetMapping("/by-user/{userAccountId}")
    public Mono<ResponseEntity<ArtesanoResponse>> findByUserAccountId(
            @PathVariable UUID userAccountId) {
        return artesanoService.findByUserAccountId(userAccountId)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    /**
     * Crea o devuelve el artesano asociado a un usuario ARTESANO recién aprobado.
     * Llamado desde auth-service al aprobar el acceso de un artesano.
     * Idempotente: si ya existe el artesano lo devuelve sin modificar.
     */
    @PostMapping("/sync-user")
    public Mono<ArtesanoResponse> syncUser(@RequestBody SyncArtesanoRequest request) {
        return artesanoService.findOrCreateForUser(request);
    }
}
