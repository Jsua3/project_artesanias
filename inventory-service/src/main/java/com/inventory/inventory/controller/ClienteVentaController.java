package com.inventory.inventory.controller;

import com.inventory.inventory.dto.CheckoutSessionResponse;
import com.inventory.inventory.dto.ClienteVentaRequest;
import com.inventory.inventory.dto.VentaResponse;
import com.inventory.inventory.service.StripeService;
import com.inventory.inventory.service.VentaService;
import com.stripe.exception.StripeException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * Endpoints para que un usuario con rol CLIENTE haga checkout y consulte
 * sus propias órdenes. Requiere JWT (lo inyecta api-gateway en X-User-Id /
 * X-User-Role). La columna cliente.user_account_id se materializa en la
 * primera compra.
 */
@RestController
@RequestMapping("/api/cliente-ventas")
public class ClienteVentaController {

    private final VentaService ventaService;
    private final StripeService stripeService;

    public ClienteVentaController(VentaService ventaService, StripeService stripeService) {
        this.ventaService = ventaService;
        this.stripeService = stripeService;
    }

    /** Crea una venta en estado PENDIENTE para el usuario autenticado. */
    @PostMapping
    public Mono<ResponseEntity<VentaResponse>> create(
            @RequestBody ClienteVentaRequest request,
            @RequestHeader(value = "X-User-Id", defaultValue = "") String userId,
            @RequestHeader(value = "X-User-Role", defaultValue = "") String userRole) {
        if (userId.isEmpty()) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }
        if (!"CLIENTE".equals(userRole)) {
            return Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN).build());
        }
        return ventaService.createClienteVenta(request, UUID.fromString(userId), null)
                .map(response -> ResponseEntity.status(HttpStatus.CREATED).body(response))
                .onErrorResume(IllegalArgumentException.class,
                        e -> Mono.just(ResponseEntity.badRequest().build()))
                .onErrorResume(IllegalStateException.class,
                        e -> Mono.just(ResponseEntity.status(HttpStatus.CONFLICT).build()));
    }

    /** Lista las ventas del propio cliente autenticado (cualquier estado). */
    @GetMapping("/mias")
    public Flux<VentaResponse> mias(
            @RequestHeader(value = "X-User-Id", defaultValue = "") String userId) {
        if (userId.isEmpty()) {
            return Flux.empty();
        }
        return ventaService.getVentasByUserAccountId(UUID.fromString(userId));
    }

    /** Detalle de una venta — requiere ownership. */
    @GetMapping("/{id}")
    public Mono<ResponseEntity<VentaResponse>> byId(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Id", defaultValue = "") String userId) {
        if (userId.isEmpty()) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }
        UUID uid = UUID.fromString(userId);
        return ventaService.isVentaOwnedBy(id, uid)
                .flatMap(owned -> {
                    if (!owned) {
                        return Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN).<VentaResponse>build());
                    }
                    return ventaService.getVenta(id)
                            .map(ResponseEntity::ok)
                            .defaultIfEmpty(ResponseEntity.notFound().build());
                });
    }

    /**
     * Fase 2b. Crea una Stripe Checkout Session para la venta PENDIENTE dada
     * y devuelve la URL hosted a la que el frontend debe redirigir al cliente.
     * Requiere ownership. 503 si Stripe no esta configurado.
     */
    @PostMapping("/{id}/checkout-session")
    public Mono<ResponseEntity<CheckoutSessionResponse>> createCheckoutSession(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Id", defaultValue = "") String userId) {
        if (userId.isEmpty()) {
            return Mono.just(ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
        }
        if (!stripeService.isConfigured()) {
            return Mono.just(ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).build());
        }
        UUID uid = UUID.fromString(userId);
        return ventaService.isVentaOwnedBy(id, uid)
                .flatMap(owned -> {
                    if (!owned) {
                        return Mono.just(ResponseEntity.status(HttpStatus.FORBIDDEN).<CheckoutSessionResponse>build());
                    }
                    return ventaService.getVentaEntity(id)
                            .switchIfEmpty(Mono.empty())
                            .flatMap(stripeService::createCheckoutSession)
                            .map(res -> ResponseEntity.ok(new CheckoutSessionResponse(res.sessionId(), res.url())))
                            .defaultIfEmpty(ResponseEntity.notFound().build());
                })
                .onErrorResume(IllegalStateException.class,
                        e -> Mono.just(ResponseEntity.status(HttpStatus.CONFLICT).build()))
                .onErrorResume(StripeException.class,
                        e -> Mono.just(ResponseEntity.status(HttpStatus.BAD_GATEWAY).build()));
    }
}
