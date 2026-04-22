package com.inventory.catalog.controller;

import com.inventory.catalog.dto.ArtesanoResponse;
import com.inventory.catalog.service.ArtesanoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Fase 2c: endpoints internos (service-to-service). El api-gateway NO
 * rutea /internal/** externamente, así que estos solo son alcanzables
 * por otros microservicios que hablen directo con catalog-service.
 *
 * El InternalGatewayFilter global sigue exigiendo X-Internal-Token.
 */
@RestController
@RequestMapping("/internal/artesanos")
public class InternalArtesanoController {

    private final ArtesanoService artesanoService;

    public InternalArtesanoController(ArtesanoService artesanoService) {
        this.artesanoService = artesanoService;
    }

    /**
     * Devuelve el artesano vinculado a un user_account_id, o 404 si no hay link.
     * Usado por inventory-service para resolver MAESTRO -> artesano_id.
     */
    @GetMapping("/by-user/{userAccountId}")
    public Mono<ResponseEntity<ArtesanoResponse>> findByUserAccountId(
            @PathVariable UUID userAccountId) {
        return artesanoService.findByUserAccountId(userAccountId)
                .map(ResponseEntity::ok)
                .defaultIfEmpty(ResponseEntity.notFound().build());
    }
}
